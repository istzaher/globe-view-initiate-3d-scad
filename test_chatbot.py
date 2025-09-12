#!/usr/bin/env python3
import requests
import json

def test_chatbot():
    url = "http://localhost:8000/api/chat"
    
    # Test bus stops query
    payload = {
        "message": "show all bus stops in Abu Dhabi",
        "context": "",
        "conversation": [],
        "spatialContext": None
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("🧪 Testing chatbot endpoint...")
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(f"Message: {data.get('message', 'No message')}")
            
            if 'context' in data and 'mapFeatures' in data['context']:
                map_features = data['context']['mapFeatures']
                print(f"🗺️ Map Features: {list(map_features.keys())}")
                for dataset_name, features in map_features.items():
                    feature_count = len(features.get('features', []))
                    print(f"  - {dataset_name}: {feature_count} features")
            else:
                print("⚠️ No map features in response")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_chatbot()
