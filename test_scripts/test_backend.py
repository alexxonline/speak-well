"""
Test script for SpeakWell backend API.
Tests the health endpoint, phrases endpoint, and transcription endpoint.
"""

import requests
import sys

API_BASE_URL = "http://localhost:8000"


def test_health_endpoint():
    """Test the root health check endpoint."""
    print("\n🧪 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Health check passed: {data}")
            return True
        else:
            print(f"  ❌ Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Health check failed: {e}")
        return False


def test_get_phrases():
    """Test the phrases endpoint."""
    print("\n🧪 Testing phrases endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/phrases")
        if response.status_code == 200:
            phrases = response.json()
            print(f"  ✅ Got {len(phrases)} phrases")
            print(f"  📋 First phrase: {phrases[0]}")
            return True
        else:
            print(f"  ❌ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_get_single_phrase():
    """Test getting a single phrase by ID."""
    print("\n🧪 Testing single phrase endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/phrases/1")
        if response.status_code == 200:
            phrase = response.json()
            print(f"  ✅ Got phrase: {phrase}")
            return True
        else:
            print(f"  ❌ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_transcribe_endpoint():
    """Test the transcription endpoint with a sample audio file."""
    print("\n🧪 Testing transcription endpoint...")
    print("  ⚠️  This test requires a sample audio file.")
    print("  📝 To test with real audio:")
    print("     1. Create a sample Portuguese audio file (e.g., sample.mp3)")
    print("     2. Run: python test_scripts/test_backend.py --with-audio")
    return True


def test_transcribe_with_audio(audio_path: str):
    """Test the transcription endpoint with an actual audio file."""
    print(f"\n🧪 Testing transcription with audio file: {audio_path}")
    try:
        with open(audio_path, "rb") as audio_file:
            files = {"audio": (audio_path, audio_file, "audio/mpeg")}
            data = {"expected_phrase": "Bom dia"}
            
            response = requests.post(
                f"{API_BASE_URL}/transcribe",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"  ✅ Transcription successful!")
                print(f"  📝 Transcribed text: {result['transcribed_text']}")
                print(f"  🎯 Expected phrase: {result['expected_phrase']}")
                print(f"  📊 Overall score: {result['overall_score']}%")
                print(f"  ✓ All correct: {result['all_correct']}")
                print(f"  🔍 Word evaluations:")
                for word_eval in result['word_evaluations']:
                    status = "✅" if word_eval['correct'] else "❌"
                    print(f"     {status} {word_eval['word']}")
                return True
            else:
                print(f"  ❌ Failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
    except FileNotFoundError:
        print(f"  ❌ Audio file not found: {audio_path}")
        return False
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 50)
    print("🚀 SpeakWell Backend Test Suite")
    print("=" * 50)
    
    # Check if backend is running
    try:
        requests.get(f"{API_BASE_URL}/", timeout=2)
    except requests.exceptions.ConnectionError:
        print("\n❌ Backend is not running!")
        print("   Please start the backend first with:")
        print("   cd backend && source ../.venv/bin/activate && uvicorn main:app --reload")
        sys.exit(1)
    
    results = []
    
    # Run tests
    results.append(("Health Endpoint", test_health_endpoint()))
    results.append(("Get All Phrases", test_get_phrases()))
    results.append(("Get Single Phrase", test_get_single_phrase()))
    
    # Check for audio file test
    if "--with-audio" in sys.argv:
        audio_path = sys.argv[sys.argv.index("--with-audio") + 1] if len(sys.argv) > sys.argv.index("--with-audio") + 1 else "sample.mp3"
        results.append(("Transcription with Audio", test_transcribe_with_audio(audio_path)))
    else:
        results.append(("Transcription Endpoint", test_transcribe_endpoint()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
