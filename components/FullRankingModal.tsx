
import React from 'react';

interface FullRankingModalProps {
    title: string;
    data: { name: string; value: string }[];
    onClose: () => void;
}

const FullRankingModal: React.FC<FullRankingModalProps> = ({ title, data, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-blue-700">{title} - 全ランキング</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <ol className="space-y-2">
                        {data.map((item, index) => (
                            <li key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-gray-50 border">
                                <div className="flex items-center min-w-0">
                                    <span className={`font-bold w-8 text-center text-lg ${
                                        index === 0 ? 'text-yellow-500' : 
                                        index === 1 ? 'text-gray-500' : 
                                        index === 2 ? 'text-orange-500' : 'text-gray-700'
                                    }`}>
                                        {index + 1}
                                    </span>
                                    <span className="ml-3 font-semibold text-gray-800 truncate">{item.name}</span>
                                </div>
                                <span className="font-bold text-blue-600 flex-shrink-0 ml-2">{item.value}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                 <div className="p-4 bg-gray-50 text-right border-t">
                    <button onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FullRankingModal;
