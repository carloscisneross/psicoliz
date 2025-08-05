#!/usr/bin/env python3
import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# Test MongoDB Atlas connection
def test_mongodb_connection():
    # Get the MongoDB URL from environment or use the one provided
    mongo_url = os.getenv('MONGO_URL', 'mongodb+srv://psicoliz_user:liz1992@cluster0.scj5wku.mongodb.net/psicoliz?retryWrites=true&w=majority&appName=Cluster0')
    
    print(f"Testing MongoDB connection to: {mongo_url.replace('liz1992', '***')}")
    
    try:
        # Try connecting with different SSL configurations
        print("\n1. Testing with default SSL configuration...")
        client = MongoClient(mongo_url, server_api=ServerApi('1'))
        client.admin.command('ping')
        print("✅ SUCCESS: Connected with default SSL configuration!")
        return client
        
    except Exception as e:
        print(f"❌ Failed with default SSL: {e}")
        
    try:
        print("\n2. Testing with SSL disabled...")
        client = MongoClient(mongo_url, ssl=False)
        client.admin.command('ping')
        print("✅ SUCCESS: Connected with SSL disabled!")
        return client
        
    except Exception as e:
        print(f"❌ Failed with SSL disabled: {e}")
        
    try:
        print("\n3. Testing with tlsAllowInvalidCertificates...")
        client = MongoClient(mongo_url, tlsAllowInvalidCertificates=True)
        client.admin.command('ping')
        print("✅ SUCCESS: Connected with tlsAllowInvalidCertificates!")
        return client
        
    except Exception as e:
        print(f"❌ Failed with tlsAllowInvalidCertificates: {e}")

    try:
        print("\n4. Testing with different connection string format...")
        # Remove srv and use direct connection
        direct_url = "mongodb://psicoliz_user:liz1992@ac-2lvhfwv-shard-00-00.scj5wku.mongodb.net:27017,ac-2lvhfwv-shard-00-01.scj5wku.mongodb.net:27017,ac-2lvhfwv-shard-00-02.scj5wku.mongodb.net:27017/psicoliz?ssl=true&replicaSet=atlas-opzjxh-shard-0&authSource=admin&retryWrites=true&w=majority"
        client = MongoClient(direct_url)
        client.admin.command('ping')
        print("✅ SUCCESS: Connected with direct connection string!")
        return client
        
    except Exception as e:
        print(f"❌ Failed with direct connection: {e}")
        
    print("\n❌ All connection attempts failed!")
    return None

if __name__ == "__main__":
    client = test_mongodb_connection()
    if client:
        try:
            # Test database operations
            db = client.psicoliz
            collection = db.test_collection
            collection.insert_one({"test": "connection successful"})
            doc = collection.find_one({"test": "connection successful"})
            print(f"✅ Database operations working: {doc}")
            collection.delete_one({"test": "connection successful"})
            print("✅ Test document cleaned up")
        except Exception as e:
            print(f"❌ Database operations failed: {e}")
        finally:
            client.close()