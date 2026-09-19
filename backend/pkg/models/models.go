package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type User struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	Email     string        `bson:"email"`
	Password  string        `bson:"password"`
	CreatedAt time.Time     `bson:"createdAt"`
}

type Poll struct {
	ID        bson.ObjectID  `bson:"_id,omitempty"`
	CreatorID bson.ObjectID  `bson:"creatorId"`
	Title     string         `bson:"title"`
	Options   []string       `bson:"options"`
	CreatedAt time.Time      `bson:"createdAt"`
	ExpiresAt time.Time      `bson:"expiresAt"`
	Status    string         `bson:"status"` // "open" or "closed"
	Results   map[string]int `bson:"results"`
}

type Vote struct {
	ID          bson.ObjectID `bson:"_id,omitempty"`
	PollID      bson.ObjectID `bson:"pollId"`
	VoterID     string        `bson:"voterId"`
	OptionIndex int           `bson:"optionIndex"`
	VotedAt     time.Time     `bson:"votedAt"`
}
type Session struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	UserID    bson.ObjectID `bson:"userId"`
	Token     string        `bson:"token"`
	ExpiresAt time.Time     `bson:"expiresAt"`
}