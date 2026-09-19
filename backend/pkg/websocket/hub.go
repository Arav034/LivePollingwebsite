package websocket

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub tracks, for each poll ID, the set of WebSocket connections currently
// watching that poll's live results.
type Hub struct {
	mu      sync.Mutex
	clients map[string]map[*websocket.Conn]bool
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*websocket.Conn]bool),
	}
}

func (h *Hub) Register(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[pollID] == nil {
		h.clients[pollID] = make(map[*websocket.Conn]bool)
	}
	h.clients[pollID][conn] = true
}

func (h *Hub) Unregister(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, ok := h.clients[pollID]; ok {
		delete(conns, conn)
		conn.Close()
	}
}

// Broadcast sends a message to every client currently watching this poll.
func (h *Hub) Broadcast(pollID string, message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for conn := range h.clients[pollID] {
		if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Println("write error, dropping client:", err)
			conn.Close()
			delete(h.clients[pollID], conn)
		}
	}
}