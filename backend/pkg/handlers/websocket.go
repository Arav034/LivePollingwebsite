package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"live-polling-tool/pkg/cache"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func PollLiveUpdates(c *gin.Context) {
	pollID := c.Param("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ctx := c.Request.Context()
	channel := "poll:" + pollID + ":updates"

	// Subscribe THIS connection directly to Redis's Pub/Sub channel for
	// this poll. Redis pushes messages to us the instant SubmitVote
	// publishes one — this is the actual "no refresh needed" mechanism.
	sub := cache.RedisClient.Subscribe(ctx, channel)
	defer sub.Close()

	// Detect when the browser disconnects (closes tab, loses network),
	// so we can stop this goroutine and clean up.
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	msgChan := sub.Channel()
	for {
		select {
		case msg := <-msgChan:
			if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
				return
			}
		case <-done:
			return
		}
	}
}