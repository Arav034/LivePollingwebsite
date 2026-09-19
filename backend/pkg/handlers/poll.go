package handlers
import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"

	"live-polling-tool/pkg/cache"
	"live-polling-tool/pkg/database"
	"live-polling-tool/pkg/models"
)

type CreatePollInput struct {
	Title   string   `json:"title" binding:"required"`
	Options []string `json:"options" binding:"required,min=2"`
}

func CreatePoll(c *gin.Context) {
	var input CreatePollInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Server-side validation beyond basic binding: trim whitespace, reject
	// blank options, and reject duplicates. Never trust the client alone.
	seen := make(map[string]bool)
	cleanOptions := []string{}
	for _, opt := range input.Options {
		trimmed := strings.TrimSpace(opt)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "options cannot be blank"})
			return
		}
		lower := strings.ToLower(trimmed)
		if seen[lower] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "duplicate options are not allowed"})
			return
		}
		seen[lower] = true
		cleanOptions = append(cleanOptions, trimmed)
	}
	if len(cleanOptions) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least 2 options are required"})
		return
	}

	// user_id was set by our AuthRequired middleware earlier
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	creatorID, err := bson.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id"})
		return
	}

	// Initialize the results map with every option starting at 0 votes
	results := make(map[string]int)
	for _, opt := range cleanOptions {
		results[opt] = 0
	}

	poll := models.Poll{
		CreatorID: creatorID,
		Title:     strings.TrimSpace(input.Title),
		Options:   cleanOptions,
		CreatedAt: time.Now(),
		Status:    "open",
		Results:   results,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	polls := database.DB.Collection("polls")
	res, err := polls.InsertOne(ctx, poll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create poll"})
		return
	}

	insertedID := res.InsertedID.(bson.ObjectID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "poll created successfully",
		"poll_id": insertedID.Hex(),
	})
}

func GetPoll(c *gin.Context) {
	idParam := c.Param("id")

	pollID, err := bson.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	polls := database.DB.Collection("polls")
	err = polls.FindOne(ctx, bson.M{"_id": pollID}).Decode(&poll)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      poll.ID.Hex(),
		"title":   poll.Title,
		"options": poll.Options,
		"status":  poll.Status,
		"results": poll.Results,
	})
}
type VoteInput struct {
	OptionIndex int `json:"option_index"`
}

func SubmitVote(c *gin.Context) {
	idParam := c.Param("id")
	pollID, err := bson.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	var input VoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	polls := database.DB.Collection("polls")

	var poll models.Poll
	if err := polls.FindOne(ctx, bson.M{"_id": pollID}).Decode(&poll); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}

	if poll.Status != "open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "this poll is closed"})
		return
	}

	// Validate option_index is actually within range — never trust client input
	if input.OptionIndex < 0 || input.OptionIndex >= len(poll.Options) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid option index"})
		return
	}
	selectedOption := poll.Options[input.OptionIndex]

	// Identify the voter via cookie, creating one if it doesn't exist yet
	voterID, err := c.Cookie("voter_id")
	if err != nil || voterID == "" {
		voterID = uuid.NewString()
		// 1 year expiry, accessible only over HTTP (not JS), fine for localhost now
		c.SetCookie("voter_id", voterID, 365*24*60*60, "/", "", false, true)
	}

	votes := database.DB.Collection("votes")

	// Check if this voter already voted on this poll
	var existingVote models.Vote
	err = votes.FindOne(ctx, bson.M{"pollId": pollID, "voterId": voterID}).Decode(&existingVote)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "you have already voted on this poll"})
		return
	}

	// Record the vote in MongoDB (source of truth)
		vote := models.Vote{
		PollID:      pollID,
		VoterID:     voterID,
		OptionIndex: input.OptionIndex,
		VotedAt:     time.Now(),
	}
	if _, err := votes.InsertOne(ctx, vote); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record vote"})
		return
	}

	// Update the results map in MongoDB
	_, err = polls.UpdateOne(ctx,
		bson.M{"_id": pollID},
		bson.M{"$inc": bson.M{"results." + selectedOption: 1}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update results"})
		return
	}

	// This is where Redis does real work: a fast atomic counter for this
	// poll's option, separate from MongoDB. This is what live results will
	// read from moments from now, once we add WebSockets — much faster than
	// re-querying MongoDB on every single vote.
	redisKey := "poll:" + pollID.Hex() + ":option:" + selectedOption
	if err := cache.RedisClient.Incr(ctx, redisKey).Err(); err != nil {
		log.Println("Redis increment failed:", err)
	}

	// Re-fetch the updated poll so we broadcast the real current state,
	// not just "something changed" — simpler for the frontend to consume.
	var updatedPoll models.Poll
	if err := polls.FindOne(ctx, bson.M{"_id": pollID}).Decode(&updatedPoll); err == nil {
		payload, _ := json.Marshal(gin.H{
			"results": updatedPoll.Results,
		})
		channel := "poll:" + pollID.Hex() + ":updates"
		if err := cache.RedisClient.Publish(ctx, channel, payload).Err(); err != nil {
			log.Println("Redis publish failed:", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "vote recorded", "voter_id": voterID})
}