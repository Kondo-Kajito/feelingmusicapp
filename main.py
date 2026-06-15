# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import urllib.request
import urllib.parse
import json

# ★GeminiのAPIキーとモデル名
GEMINI_API_KEY = "AQ.Ab8RN6INKMI0AQe0FWjri3PFO_ZMEuJzzsuo_uVEyyu7uZ1loQ"
GEMINI_MODEL_NAME = "gemini-3.5-flash" 

client = genai.Client(api_key=GEMINI_API_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmotionRequest(BaseModel):
    text: str

@app.post("/analyze-emotion")
async def analyze_emotion(req: EmotionRequest):
    prompt = f"""
    ユーザーが今の気持ちを次のように入力しました：「{req.text}」
    この感情に寄り添う優しいメッセージと、おすすめの有名な楽曲を1曲提案してください。
    必ず以下のJSONフォーマットのみで出力してください。
    {{
        "mbti": "INFP",
        "message": "寄り添うメッセージ",
        "song_title": "楽曲名（正確に）",
        "artist": "アーティスト名（正確に）"
    }}
    """
    
    try:
        # 1. AIに曲を選んでもらう
        response = client.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=prompt
        )
        
        result_text = response.text.replace('```json', '').replace('```', '').strip()
        result_json = json.loads(result_text)
        
        # 2. iTunes APIで楽曲を検索する（無料・キー不要！）
        search_query = f"{result_json['song_title']} {result_json['artist']}"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://itunes.apple.com/search?term={encoded_query}&entity=song&limit=1&country=JP"
        
        req_itunes = urllib.request.Request(url)
        with urllib.request.urlopen(req_itunes) as res:
            data = json.loads(res.read().decode())
            # 3. 曲が見つかったら、試聴URLと画像URLを追加
            if data['resultCount'] > 0:
                track = data['results'][0]
                result_json['preview_url'] = track.get('previewUrl')     # 30秒の音声データ
                result_json['artwork_url'] = track.get('artworkUrl100')  # ジャケット画像
            else:
                result_json['preview_url'] = None
            
        return result_json
        
    except Exception as e:
        print(f"エラーの詳細: {e}")
        return {"error": "AIの分析か楽曲の検索に失敗しました。"}