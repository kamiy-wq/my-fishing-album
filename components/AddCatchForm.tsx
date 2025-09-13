
import React, { useState, useEffect, useRef } from 'react';
import type { Fish, CatchLog } from '../types';
import exifr from 'exifr';
import { storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface AddCatchFormProps {
  fish: Fish;
  onClose: () => void;
  onSubmit: (newCatch: Omit<CatchLog, 'id'>) => Promise<void>;
  locations: string[];
  onAddLocation: (location: string) => Promise<void>;
  anglers: string[];
  onAddAngler: (angler: string) => Promise<void>;
  initialData?: CatchLog | null;
  onDeleteCatch?: (fishId: number, catchId: string) => Promise<void>;
}

const PhotoUploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const StarIcon = ({ className = '', ...props }: { className?: string;[key: string]: any; }) => (
  <svg className={`w-8 h-8 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const AddCatchForm: React.FC<AddCatchFormProps> = ({ fish, onClose, onSubmit, locations, onAddLocation, anglers, onAddAngler, initialData = null, onDeleteCatch }) => {
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [angler, setAngler] = useState('');
  const [notes, setNotes] = useState('');

  const [dishImagePreview, setDishImagePreview] = useState<string | null>(null);
  const [dishImageUrl, setDishImageUrl] = useState<string | null>(null);
  const [tasteRating, setTasteRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [dishNotes, setDishNotes] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const imageFileRef = useRef<File | null>(null);
  const dishImageFileRef = useRef<File | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    return () => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        if (dishImagePreview && dishImagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(dishImagePreview);
        }
    };
  }, [imagePreview, dishImagePreview]);

  useEffect(() => {
    if (initialData) {
      setImagePreview(initialData.imageUrl);
      setImageUrl(initialData.imageUrl);
      setDishImagePreview(initialData.dishImageUrl || null);
      setDishImageUrl(initialData.dishImageUrl || null);
      setDate(initialData.date);
      setLocation(initialData.location);
      setSize(initialData.size || '');
      setAngler(initialData.angler);
      setNotes(initialData.notes || '');
      setTasteRating(initialData.tasteRating || 0);
      setDishNotes(initialData.dishNotes || '');
    }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    imageFileRef.current = file;

    if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    if (isEditing) return; // Don't auto-update date if editing

    try {
      const exifData = await exifr.parse(file, ['DateTimeOriginal']);
      if (exifData && exifData.DateTimeOriginal) {
        const exifDate = new Date(exifData.DateTimeOriginal);
        setDate(exifDate.toISOString().split('T')[0]);
      }
    } catch (err) {
      console.warn('Could not read EXIF date.', err);
    }
  };
  
  const handleDishFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    dishImageFileRef.current = file;

    if (dishImagePreview && dishImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(dishImagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setDishImagePreview(previewUrl);
  };
  
  const uploadImage = async (file: File, path: string): Promise<string> => {
      if (!user) throw new Error("User not logged in");
      const storageRef = storage.ref(`users/${user.uid}/${path}/${Date.now()}-${file.name}`);
      await storageRef.put(file);
      return await storageRef.getDownloadURL();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert('ログインしてください。');
        return;
    }
    
    setIsUploading(true);

    try {
        let finalImageUrl = imageUrl;
        if (imageFileRef.current) {
            finalImageUrl = await uploadImage(imageFileRef.current, 'catches');
        }

        if (!finalImageUrl) {
            alert('釣った魚の写真を登録してください。');
            setIsUploading(false);
            return;
        }

        let finalDishImageUrl = dishImageUrl;
        if (dishImageFileRef.current) {
            finalDishImageUrl = await uploadImage(dishImageFileRef.current, 'dishes');
        }

        const trimmedLocation = location.trim();
        if (trimmedLocation && !locations.includes(trimmedLocation)) {
          await onAddLocation(trimmedLocation);
        }

        const trimmedAngler = angler.trim();
        if (trimmedAngler && !anglers.includes(trimmedAngler)) {
            await onAddAngler(trimmedAngler);
        }

        await onSubmit({
          imageUrl: finalImageUrl,
          date: date || new Date().toISOString().split('T')[0],
          location: trimmedLocation || '場所不明',
          angler: trimmedAngler || '釣り人不明',
          size: size.trim() || undefined,
          notes: notes.trim() || undefined,
          dishImageUrl: finalDishImageUrl ?? undefined,
          tasteRating: tasteRating > 0 ? tasteRating : undefined,
          dishNotes: dishNotes.trim() || undefined,
        });
        
        onClose();

    } catch (error) {
        console.error("Error submitting form:", error);
        alert('データの保存に失敗しました。');
    } finally {
        setIsUploading(false);
    }
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageUrl(null);
    imageFileRef.current = null;
  }
  
   const removeDishImage = () => {
    if (dishImagePreview && dishImagePreview.startsWith('blob:')) URL.revokeObjectURL(dishImagePreview);
    setDishImagePreview(null);
    setDishImageUrl(null);
    dishImageFileRef.current = null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-blue-700">{isEditing ? '釣果を編集' : `釣果を記録 (${fish.name})`}</h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">釣った魚の写真<span className="text-red-500 ml-1">*</span></label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                     <div>
                        <img src={imagePreview} alt="Preview" className="mx-auto h-40 w-auto rounded-md object-contain mb-4" />
                        <div className="flex justify-center items-center gap-4 text-sm">
                            <label htmlFor="file-upload" className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                                写真を変更
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <button type="button" onClick={removeImage} className="font-medium text-red-600 hover:text-red-500">
                                写真を削除
                            </button>
                        </div>
                    </div>
                  ) : (
                    <>
                      <PhotoUploadIcon />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>写真を選ぶ</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">釣った日</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>

            <div>
                <label htmlFor="angler" className="block text-sm font-medium text-gray-700">釣った人</label>
                <input type="text" id="angler" list="angler-list" value={angler} onChange={e => setAngler(e.target.value)} placeholder="例: パパ" className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                <datalist id="angler-list">
                  {anglers.map((name) => (<option key={name} value={name} />))}
                </datalist>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">場所</label>
               <input type="text" id="location" list="location-list" value={location} onChange={e => setLocation(e.target.value)} placeholder="例: ○○海釣り公園" className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                <datalist id="location-list">
                  {locations.map((loc) => (<option key={loc} value={loc} />))}
                </datalist>
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700">大きさ</label>
              <input type="text" id="size" value={size} onChange={e => setSize(e.target.value)} placeholder="例: 35cm" className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">メモ</label>
              <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="例: 人生で初めて釣った！" className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">食べた記録</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">料理の写真</label>
                   <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                       {dishImagePreview ? (
                        <div>
                            <img src={dishImagePreview} alt="Dish Preview" className="mx-auto h-40 w-auto rounded-md object-contain mb-4" />
                            <div className="flex justify-center items-center gap-4 text-sm">
                                <label htmlFor="dish-file-upload" className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                                    写真を変更
                                    <input id="dish-file-upload" name="dish-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleDishFileChange} />
                                </label>
                                <button type="button" onClick={removeDishImage} className="font-medium text-red-600 hover:text-red-500">
                                    写真を削除
                                </button>
                            </div>
                        </div>
                      ) : (
                        <>
                          <PhotoUploadIcon />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="dish-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                              <span>料理の写真を選ぶ</span>
                              <input id="dish-file-upload" name="dish-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleDishFileChange} />
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">味評価</label>
                  <div className="flex items-center mt-1" onMouseLeave={() => setHoverRating(0)}>
                    {[...Array(5)].map((_, index) => {
                      const ratingValue = index + 1;
                      return (
                        <button type="button" key={ratingValue} onClick={() => setTasteRating(ratingValue)} onMouseEnter={() => setHoverRating(ratingValue)} className="focus:outline-none">
                          <StarIcon className={`cursor-pointer transition-colors ${ratingValue <= (hoverRating || tasteRating) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="dish-notes" className="block text-sm font-medium text-gray-700">コメント</label>
                  <textarea id="dish-notes" value={dishNotes} onChange={e => setDishNotes(e.target.value)} rows={2} placeholder="例: 塩焼きにしたら、ふっくらして最高に美味しかった！" className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
                </div>
              </div>
            </div>

          </div>
          
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <div>
              {isEditing && onDeleteCatch && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('この釣果記録を削除しますか？')) {
                      if (initialData) {
                        await onDeleteCatch(fish.id, initialData.id);
                        onClose();
                      }
                    }
                  }}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                キャンセル
              </button>
              <button type="submit" disabled={isUploading} className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-wait">
                {isUploading ? '保存中...' : (isEditing ? '更新する' : '記録する')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCatchForm;
