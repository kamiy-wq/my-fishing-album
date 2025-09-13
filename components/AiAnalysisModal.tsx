
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface AiAnalysisModalProps {
    onClose: () => void;
    onComplete: (fishName: string, imageFile: File) => void;
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({ onClose, onComplete }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<string[]>([]);
    const [reasoning, setReasoning] = useState<string | null>(null);
    const [showReasoning, setShowReasoning] = useState(false);
    const [resultIndex, setResultIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            const newPreviewUrl = URL.createObjectURL(file);
            setImagePreview(newPreviewUrl);
            setResults([]);
            setReasoning(null);
            setShowReasoning(false);
            setError(null);
        }
    };

    const runAnalysis = async () => {
        if (!imageFile) {
            setError('まず写真を選んでください。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);
        setReasoning(null);
        setShowReasoning(false);
        setResultIndex(0);

        try {
            // FIX: Use Vite's environment variables (`import.meta.env`) for client-side code
            // instead of Node.js's `process.env`. According to Gemini API guidelines,
            // the API key should come from an environment variable. In Vite, this must
            // be accessed via `import.meta.env` and the variable must be prefixed with `VITE_`.
            if (!import.meta.env.VITE_API_KEY) {
                throw new Error("APIキーが設定されていません。");
            }
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            const imagePart = await fileToGenerativePart(imageFile);
            
            const prompt = '画像に写っている魚を特定してください。最も可能性が高い魚の一般的な日本語の名称（学名は含めないでください）を最大3つ、候補として挙げてください。そして、一番可能性の高い魚について、その判定理由（体型、色、ヒレの形など）も教えてください。';
            const schema = {
                type: Type.OBJECT,
                properties: {
                    candidates: {
                        type: Type.ARRAY,
                        description: '最も可能性が高い魚種名の一般的な日本語名（学名は含めない）の候補リスト（最大3つ）',
                        items: { type: Type.STRING }
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: '最も可能性が高い候補について、その判定理由（体型、色、ヒレの形など）'
                    }
                },
                required: ['candidates', 'reasoning']
            };

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                parts: [ imagePart, { text: prompt } ]
              },
              config: {
                responseMimeType: "application/json",
                responseSchema: schema
              }
            });

            const text = response.text.trim();
            if (!text) {
                throw new Error("AIは魚を特定できませんでした。別の写真で試してください。");
            }
            
            const parsedResponse = JSON.parse(text);
            const { candidates, reasoning: analysisReason } = parsedResponse;

            if(!candidates || !Array.isArray(candidates) || candidates.length === 0) {
                 throw new Error("AIは魚を特定できませんでした。別の写真で試してください。");
            }
            setResults(candidates);
            setReasoning(analysisReason || "AIは判定理由を提供しませんでした。");

        } catch (err) {
            console.error("AI analysis failed:", err);
            const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
            let userFriendlyMessage = `AIでの分析中にエラーが発生しました。\n${errorMessage}`;
            if (errorMessage.toLowerCase().includes('api key')) {
                userFriendlyMessage = "AIの分析に失敗しました。APIキーが正しく設定されていない可能性があります。";
            } else if (errorMessage.toLowerCase().includes('internal')) {
                userFriendlyMessage = "AIサーバーで一時的な問題が発生したようです。しばらくしてからもう一度お試しください。";
            }
            setError(userFriendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-blue-700">AI魚種判定</h2>
                    <p className="text-gray-600 text-sm">写真から魚の名前をAIが判定します。結果は100%正確ではない場合があります。</p>
                </div>

                <div className="p-6 text-center">
                    {!imagePreview && (
                        <div className="flex flex-col items-center gap-4">
                            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                写真を撮る / 選ぶ
                            </button>
                            <p className="text-xs text-gray-500">魚全体がはっきり写っている写真を選ぶと精度が上がります。</p>
                        </div>
                    )}

                    {imagePreview && (
                        <div>
                            <img src={imagePreview} alt="Preview" className="mx-auto max-h-60 rounded-md object-contain mb-4" />
                            {/* FIX: Cleaned up onClick handler for clarity and to remove confusing comment. */}
                            <button onClick={() => { 
                                setImagePreview(null); 
                                setImageFile(null); 
                                setResults([]); 
                                setError(null); 
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                    fileInputRef.current.click();
                                }
                            }} className="text-sm text-blue-600 hover:text-blue-800">
                                写真を変更する
                            </button>
                        </div>
                    )}
                </div>

                {imagePreview && results.length === 0 && !isLoading && (
                     <div className="px-6 pb-6">
                        <button onClick={runAnalysis} disabled={isLoading} className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait flex items-center justify-center">
                            この魚の名前を判定する
                        </button>
                    </div>
                )}
                
                 {isLoading && (
                    <div className="px-6 pb-6 flex flex-col items-center justify-center text-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="mt-3 text-gray-600 font-semibold">AIが判定中です...</p>
                        <p className="text-sm text-gray-500">少しお待ちください</p>
                    </div>
                )}
                
                {error && <p className="text-center text-red-500 text-sm px-6 pb-4 whitespace-pre-wrap">{error}</p>}
                
                {results.length > 0 && (
                    <div className="px-6 pb-6 text-center">
                        <p className="text-gray-600">AIの判定結果 <span className="font-bold">({resultIndex + 1}/{results.length})</span>:</p>
                        <p className="text-3xl font-bold text-blue-700 my-2">{results[resultIndex]}</p>
                        
                        <button 
                            onClick={() => imageFile && onComplete(results[resultIndex], imageFile)} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                           「{results[resultIndex]}」として記録する
                        </button>

                         {reasoning && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setShowReasoning(!showReasoning)}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-all duration-300"
                                >
                                    {showReasoning ? '理由を隠す' : '判定の理由を見る'}
                                </button>
                                {showReasoning && (
                                    <div className="mt-2 p-3 bg-gray-100 rounded-md text-left text-sm text-gray-700 transition-all duration-300 ease-in-out">
                                        <h4 className="font-bold mb-1 text-gray-800">AIによる判定理由:</h4>
                                        <p className="whitespace-pre-wrap">{reasoning}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {results.length > 1 && (
                            <div className="mt-3 flex justify-between items-center">
                                <button 
                                  onClick={() => setResultIndex(p => p - 1)} 
                                  disabled={resultIndex === 0}
                                  className="text-sm text-blue-600 hover:underline p-2 disabled:text-gray-400 disabled:no-underline"
                                >
                                    ← 前の候補
                                </button>
                                
                                <span className="text-center text-sm text-gray-500">違う魚ですか？</span>
                                
                                <button 
                                  onClick={() => setResultIndex(p => p + 1)} 
                                  disabled={resultIndex >= results.length - 1}
                                  className="text-sm text-blue-600 hover:underline p-2 disabled:text-gray-400 disabled:no-underline"
                                >
                                    次の候補 →
                                </button>
                            </div>
                        )}
                    </div>
                )}


                <div className="p-4 bg-gray-50 text-right">
                    <button onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAnalysisModal;