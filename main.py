from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import urllib.request
import urllib.parse
import json

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

# データの受け取り口に genre と favorite_artist を追加
class EmotionRequest(BaseModel):
    text: str
    genre: str = ""
    favorite_artist: str = ""

@app.post("/analyze-emotion")
async def analyze_emotion(req: EmotionRequest):
    # AIへの指示書（プロンプト）にユーザーの好みを組み込む！
    prompt = f"""
    ユーザーが今の気持ちを次のように入力しました：「{req.text}」
    
    【ユーザーの音楽の好み（もし指定があれば選曲の参考にしてください）】
    - 好きなジャンル: {req.genre if req.genre else '特になし'}
    - 好きなアーティストや雰囲気: {req.favorite_artist if req.favorite_artist else '特になし'}
    
    この感情に寄り添う優しいメッセージと、ユーザーの好みを考慮したおすすめの有名な楽曲を1曲提案してください。
    必ず以下のJSONフォーマットのみで出力してください。
    {{
        "mbti": "INFP",
        "message": "寄り添うメッセージ",
        "song_title": "楽曲名（正確に）",
        "artist": "アーティスト名（正確に）"
    }}
    """
    
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=prompt
        )
        
        result_text = response.text.replace('```json', '').replace('```', '').strip()
        result_json = json.loads(result_text)
        
        search_query = f"{result_json['song_title']} {result_json['artist']}"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://itunes.apple.com/search?term={encoded_query}&entity=song&limit=1&country=JP"
        
        req_itunes = urllib.request.Request(url)
        with urllib.request.urlopen(req_itunes) as res:
            data = json.loads(res.read().decode())
            if data['resultCount'] > 0:
                track = data['results'][0]
                result_json['preview_url'] = track.get('previewUrl')
                result_json['artwork_url'] = track.get('artworkUrl100')
            else:
                result_json['preview_url'] = None
            
        return result_json
        
    except Exception as e:
        print(f"エラーの詳細: {e}")
        return {"error": "AIの分析か楽曲の検索に失敗しました。"}