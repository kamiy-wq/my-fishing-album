import React from 'react';

interface PremiumModalProps {
    onClose: () => void;
    onUpgrade: () => void;
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <li className="flex items-start space-x-4">
        <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-2">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-gray-800">{title}</h4>
            <p className="text-gray-600 text-sm">{description}</p>
        </div>
    </li>
);

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-white mt-3">プレミアムプランで釣りをさらに楽しく！</h2>
                    <p className="text-blue-200 text-sm mt-1">限定機能で、釣りの思い出をもっと豊かに。</p>
                </div>

                <div className="p-6">
                    <ul className="space-y-4">
                        <Feature 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                            title="AIによる魚種判定"
                            description="写真から魚の名前をAIが判定します。100%正確ではないため、最も可能性の高い候補を表示します。なんて魚か分からない時に便利！"
                        />
                         <Feature 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
                            title="新しい魚を図鑑に追加"
                            description="図鑑にない魚を自分で追加可能に。世界に一つだけのオリジナル図鑑を作ろう！"
                        />
                        <Feature 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                            title="すべてのランキングを閲覧"
                            description="「大物賞」ランキングの全ての順位が見られるようになります。家族みんなで大物を競い合おう！"
                        />
                    </ul>

                    <div className="mt-6">
                         <button 
                            onClick={onUpgrade}
                            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            プレミアム機能を試す
                        </button>
                         <button onClick={onClose} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700">
                            あとで
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;