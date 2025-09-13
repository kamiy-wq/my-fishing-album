
import React, { useState } from 'react';
import type { Fish } from '../types.ts';

interface AddFishFormProps {
  onClose: () => void;
  onSubmit: (newFish: Omit<Fish, 'id' | 'catches'>) => void;
}

const AddFishForm: React.FC<AddFishFormProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [habitat, setHabitat] = useState('');
  const [defaultImageUrl, setDefaultImageUrl] = useState('');
  const [isPoisonous, setIsPoisonous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !habitat || !defaultImageUrl) {
        alert('すべての項目を入力してください。');
        return;
    }
    onSubmit({
      name,
      description,
      habitat,
      defaultImageUrl,
      isPoisonous,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-blue-700">新しい魚を図鑑に追加</h2>
            <p className="text-gray-600">新しい魚の情報を入力してください。</p>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="fish-name" className="block text-sm font-medium text-gray-700">魚の名前</label>
              <input type="text" id="fish-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="fish-desc" className="block text-sm font-medium text-gray-700">説明</label>
              <textarea id="fish-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
              <label htmlFor="fish-habitat" className="block text-sm font-medium text-gray-700">生息地</label>
              <input type="text" id="fish-habitat" value={habitat} onChange={e => setHabitat(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="fish-image" className="block text-sm font-medium text-gray-700">デフォルト画像のURL</label>
              <input type="url" id="fish-image" value={defaultImageUrl} onChange={e => setDefaultImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex items-center">
              <input id="is-poisonous" type="checkbox" checked={isPoisonous} onChange={e => setIsPoisonous(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="is-poisonous" className="ml-2 block text-sm text-gray-900">毒がありますか？</label>
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex justify-end items-center gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFishForm;