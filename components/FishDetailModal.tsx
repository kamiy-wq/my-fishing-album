
import React, { useState } from 'react';
import type { Fish, CatchLog } from '../types';
import AddCatchForm from './AddCatchForm';

interface FishDetailModalProps {
  fish: Fish;
  onClose: () => void;
  onAddCatch: (fishId: number, newCatch: Omit<CatchLog, 'id'>) => Promise<void>;
  onEditCatch: (fishId: number, updatedCatch: CatchLog) => Promise<void>;
  onDeleteCatch: (fishId: number, catchId: string) => Promise<void>;
  onSetCoverImage: (fishId: number, catchId: string) => Promise<void>;
  locations: string[];
  onAddLocation: (location: string) => Promise<void>;
  anglers: string[];
  onAddAngler: (angler: string) => Promise<void>;
  isLoggedIn: boolean;
}

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;


const FishDetailModal: React.FC<FishDetailModalProps> = ({ fish, onClose, onAddCatch, onEditCatch, onDeleteCatch, onSetCoverImage, locations, onAddLocation, anglers, onAddAngler, isLoggedIn }) => {
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingCatch, setEditingCatch] = useState<CatchLog | null>(null);
  const [isSettingCover, setIsSettingCover] = useState<string | null>(null);

  const handleFormSubmit = async (catchData: Omit<CatchLog, 'id'>) => {
    if (formMode === 'edit' && editingCatch) {
      await onEditCatch(fish.id, { ...editingCatch, ...catchData });
    } else {
      await onAddCatch(fish.id, catchData);
    }
  };
  
  const handleOpenEditForm = (catchLog: CatchLog) => {
    setEditingCatch(catchLog);
    setFormMode('edit');
  };

  if (formMode) {
    return (
      <AddCatchForm 
        fish={fish} 
        onClose={() => { setFormMode(null); setEditingCatch(null); }}
        onSubmit={handleFormSubmit}
        locations={locations}
        onAddLocation={onAddLocation}
        anglers={anglers}
        onAddAngler={onAddAngler}
        initialData={editingCatch}
        onDeleteCatch={onDeleteCatch}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-4 sm:p-6 border-b z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-700">{fish.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2 border-l-4 border-blue-500 pl-3">図鑑の情報</h3>
            <p className="text-gray-600">{fish.description}</p>
            <p className="mt-2 text-sm text-gray-500"><strong className="font-medium">生息地:</strong> {fish.habitat}</p>
          </div>

          <div>
             <h3 className="text-lg font-semibold text-gray-700 mb-3 border-l-4 border-blue-500 pl-3">釣果アルバム ({fish.catches.length}匹)</h3>
            {fish.catches.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">この魚はまだ釣れていません。</p>
                <p className="text-gray-400 text-sm mt-1">最初の1匹を記録しよう！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fish.catches.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg overflow-hidden shadow flex flex-col">
                    <div className="relative">
                      <img src={log.imageUrl} alt={`Catch on ${log.date}`} className="w-full h-48 object-cover bg-gray-200" loading="lazy" />
                      {fish.coverImageCatchId === log.id && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow">
                          <StarIcon className="w-3 h-3"/> <span>代表写真</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-sm space-y-1 flex-grow">
                      <p><strong>釣った日:</strong> {log.date}</p>
                      <p><strong>場所:</strong> {log.location}</p>
                      {log.size && <p><strong>大きさ:</strong> {log.size}</p>}
                      <p><strong>釣った人:</strong> {log.angler}</p>
                      {log.notes && <p className="mt-2 text-xs text-gray-600 bg-white p-2 rounded"><strong>メモ:</strong> {log.notes}</p>}
                    </div>
                     {(log.dishImageUrl || log.tasteRating || log.dishNotes) && (
                      <div className="border-t border-gray-200 p-3 text-sm space-y-2">
                          <h4 className="font-semibold text-gray-600 text-xs uppercase tracking-wider">食べた記録</h4>
                          {log.dishImageUrl && (
                              <img src={log.dishImageUrl} alt="料理の写真" className="w-full h-32 object-cover rounded-md mt-1 bg-gray-200" loading="lazy" />
                          )}
                          {log.tasteRating && log.tasteRating > 0 && (
                              <div className="flex items-center">
                                  <span className="font-bold mr-2 text-gray-800">評価:</span>
                                  <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                          <StarIcon key={i} className={i < log.tasteRating! ? 'text-yellow-400' : 'text-gray-300'} />
                                      ))}
                                  </div>
                              </div>
                          )}
                          {log.dishNotes && (
                              <p className="mt-1 text-xs text-gray-600 bg-white p-2 rounded"><strong>コメント:</strong> {log.dishNotes}</p>
                          )}
                      </div>
                    )}
                    <div className="border-t border-gray-200 bg-white p-2 flex justify-end items-center gap-2">
                      <button 
                        onClick={async () => {
                          setIsSettingCover(log.id);
                          try {
                            await onSetCoverImage(fish.id, log.id);
                          } finally {
                            setIsSettingCover(null);
                          }
                        }}
                        disabled={fish.coverImageCatchId === log.id || !!isSettingCover}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors py-1 px-2 rounded-md hover:bg-gray-100"
                        title="代表写真に設定する"
                        aria-label="代表写真に設定する"
                      >
                        <StarIcon className={`w-4 h-4 ${fish.coverImageCatchId === log.id ? 'text-yellow-500' : ''}`} />
                        <span>{isSettingCover === log.id ? '設定中...' : '代表に設定'}</span>
                      </button>
                      <button onClick={() => handleOpenEditForm(log)} className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 py-1 px-2 rounded-md hover:bg-gray-100 transition-colors" title="編集する" aria-label="編集する"><EditIcon /><span>編集</span></button>
                      <button 
                        onClick={async () => {
                          if (window.confirm('この釣果記録を削除しますか？この操作は元に戻せません。')) {
                            await onDeleteCatch(fish.id, log.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 py-1 px-2 rounded-md hover:bg-red-50 transition-colors" title="削除する" aria-label="削除する">
                          <TrashIcon /><span>削除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t">
          <button 
            onClick={() => setFormMode('add')}
            disabled={!isLoggedIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            title={!isLoggedIn ? "釣果を記録するにはログインが必要です" : ""}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            {isLoggedIn ? '釣果を記録する' : 'ログインして記録する'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FishDetailModal;
