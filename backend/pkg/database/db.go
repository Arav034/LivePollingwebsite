package database

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

var MongoClient *mongo.Client
var DB *mongo.Database

func ConnectMongo(mongoURI, dbName string) error {
	// Note: v2's Connect no longer takes a context — it connects lazily,
	// meaning it doesn't actually reach out to the server yet here.
	client, err := mongo.Connect(options.Client().ApplyURI(mongoURI))
	if err != nil {
		return err
	}

	// This is what actually verifies the connection works, with a timeout
	// so we don't hang forever if the URI or network is wrong.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return err
	}

	MongoClient = client
	DB = client.Database(dbName)

	return nil
}

func DisconnectMongo() error {
	if MongoClient == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return MongoClient.Disconnect(ctx)
}