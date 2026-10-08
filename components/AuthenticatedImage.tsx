import React, { useEffect, useState } from 'react';
import { getBlob, ref as storageRef } from 'firebase/storage';
import { secureStorage } from '../firebase';
import { extractStoragePath } from '../storageImages';

interface AuthenticatedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  source?: string | null;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ source, alt = '', ...props }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setResolvedUrl(null);
    setFailed(false);

    if (!source) {
      setFailed(true);
      return;
    }

    const path = extractStoragePath(source);

    if (!path) {
      setResolvedUrl(source);
      return;
    }

    getBlob(storageRef(secureStorage, path))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedUrl(objectUrl);
      })
      .catch((error) => {
        console.error('Failed to load protected image:', error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  if (!resolvedUrl) {
    return (
      <div
        className={props.className}
        aria-label={failed ? `${alt}（画像を読み込めませんでした）` : `${alt}（読み込み中）`}
      />
    );
  }

  return <img src={resolvedUrl} alt={alt} {...props} />;
};

export default AuthenticatedImage;
