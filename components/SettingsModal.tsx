
import React from 'react';

interface SettingsModalProps {
    isPremium: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

const PremiumBadge: React.FC<{isPremium: boolean}> = ({ isPremium }) => (
    isPremium ? (
        <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
            プレミアムプラン
        </span>
    ) : (
        <span className="bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1 rounded-full">
            無料プラン
        </span>
    )
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isPremium, onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-blue-700">設定</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <span className="font-semibold text-gray-800">現在のプラン:</span>
                        <PremiumBadge isPremium={isPremium} />
                    </div>

                    {isPremium ? (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">プレミアムプランをご利用中です</h3>
                            <p className="text-gray-600">いつもご利用ありがとうございます！AI魚種判定やランキング機能など、全ての機能をお楽しみいただけます。</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">プレミアムプランにアップグレード</h3>
                            <p className="text-gray-600 mb-4">アップグレードすると、AIによる魚種判定やランキングの全表示など、全ての機能が使えるようになります！</p>
                            <button 
                                onClick={onUpgrade}
                                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                プレミアム機能を試す
                            </button>
                        </div>
                    )}
                </div>
                 <div className="p-4 bg-gray-50 text-right">
                    <button onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
