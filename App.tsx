
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './firebase.ts';
import type { Fish, CatchLog } from './types.ts';
import Header from './components/Header.tsx';
import FishGrid from './components/FishGrid.tsx';
import FishDetailModal from './components/FishDetailModal.tsx';
import EncyclopediaProgress from './components/EncyclopediaProgress.tsx';
import Ranking from './components/Ranking.tsx';
import { useAuth } from './hooks/useAuth.tsx';
import firebase from 'firebase/compat/app';

// Data from initialFishData.ts moved here to resolve build issues.
const initialFishData: Fish[] = [
  {
    id: 1,
    name: 'アイゴ (藍子)',
    description: 'ヒレに毒を持つため取り扱いには注意が必要ですが、適切に処理すれば美味しい白身魚です。磯の香りが特徴。',
    habitat: '主に南日本の沿岸の岩礁域や藻場に生息。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Siganus_fuscescens_by_OpenCage.jpg/640px-Siganus_fuscescens_by_OpenCage.jpg',
    catches: [],
    isPoisonous: true,
  },
  {
    id: 2,
    name: 'アジ (鯵)',
    description: '日本の食卓でおなじみの魚。サビキ釣りなどで手軽に釣れるため、ファミリーフィッシングに人気です。',
    habitat: '沿岸の表層から中層を群れで回遊。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Trachurus_japonicus_-_Shima_Aquarium.jpg/640px-Trachurus_japonicus_-_Shima_Aquarium.jpg',
    catches: [],
  },
  {
    id: 3,
    name: 'アコウ (キジハタ)',
    description: '関西地方で「アコウ」と呼ばれる高級魚。美しいオレンジ色の体に斑点模様があります。根魚の王様とも呼ばれます。',
    habitat: '沿岸の岩礁域に生息し、あまり移動しない。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Epinephelus_akaara_by_OpenCage.jpg/640px-Epinephelus_akaara_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 4,
    name: 'アナゴ (穴子)',
    description: 'ウナギによく似た細長い魚。昼間は砂泥の穴に隠れ、夜になると活動します。天ぷらや煮アナゴが絶品。血や粘液に毒があるため、調理の際は注意が必要です。',
    habitat: '内湾の砂泥底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Conger_myriaster_by_OpenCage.jpg/640px-Conger_myriaster_by_OpenCage.jpg',
    catches: [],
    isPoisonous: true,
  },
  {
    id: 5,
    name: 'イカ (烏賊)',
    description: '10本の足を持つ海の生き物。種類によって様々な釣り方があり、食べても非常に美味しい人気のターゲットです。',
    habitat: '沿岸から沖合まで、種類によって様々な場所に生息。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Aoriika_aquarium.jpg/640px-Aoriika_aquarium.jpg',
    catches: [],
  },
  {
    id: 6,
    name: 'イシダイ (石鯛)',
    description: '体に黒い縞模様があるのが特徴で、大きくなると模様が薄れます。磯の王者と呼ばれ、引きが非常に強いです。',
    habitat: '沿岸の岩礁域。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Oplegnathus_fasciatus_by_OpenCage.jpg/640px-Oplegnathus_fasciatus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 7,
    name: 'イワシ (鰯)',
    description: '小さな魚で大きな群れを作って泳ぎます。他の大きな魚のエサになることが多いですが、食用としても人気があります。',
    habitat: '日本各地の沿岸域。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Sardinops_melanostictus_from_school_in_Hakkeijima.JPG/640px-Sardinops_melanostictus_from_school_in_Hakkeijima.JPG',
    catches: [],
  },
  {
    id: 8,
    name: 'ウマヅラハギ (馬面剥)',
    description: '顔が馬のように長いことからこの名前がつきました。カワハギと同じく、皮を剥いでから調理します。',
    habitat: '沿岸の岩礁域や砂礫底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Thamnaconus_modestus_by_OpenCage.jpg/640px-Thamnaconus_modestus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 9,
    name: 'カサゴ (笠子)',
    description: '岩の間に隠れるのが得意な魚。ガシラとも呼ばれます。見た目はゴツゴツしていますが、白身は上品で美味しいです。',
    habitat: '沿岸の岩礁域やテトラポッドの隙間。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sebastiscus_marmoratus_by_OpenCage.jpg/640px-Sebastiscus_marmoratus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 10,
    name: 'カマス (魳)',
    description: '鋭い歯を持つ細長い魚。群れで小魚を追いかけます。塩焼きにすると非常に美味しいです。',
    habitat: '沿岸の表層を群れで回遊。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sphyraena_japonica_in_Numazu.jpg/640px-Sphyraena_japonica_in_Numazu.jpg',
    catches: [],
  },
  {
    id: 11,
    name: 'カレイ (鰈)',
    description: '平たい体で海底に潜む魚。目が体の右側についているのが特徴です。投げ釣りで人気のターゲット。',
    habitat: '砂泥底の海底に生息。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Verasper_variegatus_by_OpenCage.jpg/640px-Verasper_variegatus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 12,
    name: 'カワハギ (皮剥)',
    description: '硬い皮を剥いでから調理することからこの名がつきました。エサ取り名人として知られ、釣るにはテクニックが必要です。',
    habitat: '岩礁域や砂礫底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Stephanolepis_cirrhifer_by_OpenCage.jpg/640px-Stephanolepis_cirrhifer_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 13,
    name: 'キビレ (黄鰭)',
    description: 'クロダイによく似ていますが、ヒレの先が黄色いのが特徴です。クロダイよりも河口などの汽水域を好みます。',
    habitat: '内湾や河口の砂泥底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Acanthopagrus_latus_by_OpenCage.jpg/640px-Acanthopagrus_latus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 14,
    name: 'キス (鱚)',
    description: '砂浜の女王と呼ばれる美しい魚。上品な白身で天ぷらなどにすると絶品。投げ釣りで手軽に狙えます。',
    habitat: '内湾の砂底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Sillago_japonica_from_Nagasaki_Japan_20161102.JPG/640px-Sillago_japonica_from_Nagasaki_Japan_20161102.JPG',
    catches: [],
  },
  {
    id: 15,
    name: 'キュウセン (九仙)',
    description: 'ベラの仲間で、鮮やかな緑色のオスと、茶色っぽいメスで体の色が異なります。投げ釣りでよく釣れます。',
    habitat: '沿岸の砂地や岩礁が混じる場所。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Halichoeres_poecilopterus_by_OpenCage.jpg/640px-Halichoeres_poecilopterus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 16,
    name: 'クサフグ (草河豚)',
    description: '岸辺でよく見かける小型のフグ。怒ると体をぷっくりと膨らませます。内臓などに毒があるので食べられません。',
    habitat: '沿岸の砂浜や内湾。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Takifugu_niphobles_by_OpenCage.jpg/640px-Takifugu_niphobles_by_OpenCage.jpg',
    catches: [],
    isPoisonous: true,
  },
  {
    id: 17,
    name: 'クロダイ (黒鯛)',
    description: 'チヌとも呼ばれる警戒心の強い魚。堤防や磯からの釣りの人気ターゲットで、様々な釣り方で狙えます。',
    habitat: '内湾、河口、磯など幅広い環境に適応。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Acanthopagrus_schlegelii_-_Enoshima_Aquarium_-_02.jpg/640px-Acanthopagrus_schlegelii_-_Enoshima_Aquarium_-_02.jpg',
    catches: [],
  },
  {
    id: 18,
    name: 'コブダイ (瘤鯛)',
    description: '大きくなるとおでこにコブができるのが特徴的なベラの仲間。特にオスはコブが大きくなります。',
    habitat: '沿岸の岩礁域。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Semicossyphus_reticulatus_by_OpenCage.jpg/640px-Semicossyphus_reticulatus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 19,
    name: 'ササノハベラ (笹の葉遍羅)',
    description: '笹の葉に似た模様があるベラの仲間。好奇心が強く、エサを見つけるとすぐに寄ってきます。',
    habitat: '沿岸の岩礁域や藻場。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Pseudolabrus_japonicus_by_OpenCage.jpg/640px-Pseudolabrus_japonicus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 20,
    name: 'サバ (鯖)',
    description: '青魚の代表格。DHAやEPAが豊富で栄養価が高い。群れで行動し、強い引きで釣り人を楽しませます。',
    habitat: '日本近海の沿岸域から沖合まで広く分布。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Scomber_japonicus_from_Kagoshima_Japan_20161023.JPG/640px-Scomber_japonicus_from_Kagoshima_Japan_20161023.JPG',
    catches: [],
  },
  {
    id: 21,
    name: 'サヨリ (細魚)',
    description: 'サンマのように細長い体と、下のくちばしが長く突き出ているのが特徴。水面近くを泳ぎます。',
    habitat: '内湾や沿岸の海面近く。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Hyporhamphus_sajori_by_OpenCage.jpg/640px-Hyporhamphus_sajori_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 22,
    name: 'サワラ (鰆)',
    description: '体が細長く、スマートな魚。春に旬を迎えることから「鰆」と書きます。若い魚はサゴシと呼ばれます。',
    habitat: '沿岸から沖合の表層を回遊。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Scomberomorus_niphonius_by_OpenCage.jpg/640px-Scomberomorus_niphonius_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 23,
    name: 'スズキ (鱸)',
    description: '沿岸や河口域に生息する人気のゲームフィッシュ。ルアーに対する反応が良く、多くの釣り人を魅了します。',
    habitat: '内湾、河口、磯など。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lateolabrax_japonicus_-_Tokyo_Sea_Life_Park.JPG/640px-Lateolabrax_japonicus_-_Tokyo_Sea_Life_Park.JPG',
    catches: [],
  },
  {
    id: 24,
    name: 'タコ (蛸)',
    description: '8本の足を持つ、賢い海の生き物。岩場の隙間や壺の中に隠れるのが得意です。独特の釣り方があります。',
    habitat: '沿岸の岩礁域や砂泥底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Octopus_vulgaris2.jpg/640px-Octopus_vulgaris2.jpg',
    catches: [],
  },
  {
    id: 25,
    name: 'タチウオ (太刀魚)',
    description: '刀のように銀色に輝く細長い体が特徴。夜釣りの人気ターゲットで、独特の引きが楽しめます。',
    habitat: '沖合の泥底に生息し、夜間は表層に浮上する。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Trichiurus_japonicus_by_OpenCage.jpg/640px-Trichiurus_japonicus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 26,
    name: 'ハマチ (鰤)',
    description: 'ブリの若魚。関西地方でよく使われる呼び名です。養殖も盛んで、お刺身などで人気があります。',
    habitat: '日本海や太平洋の温帯域を回遊。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Seriola_quinqueradiata_-_K%C5%8Dchi.jpg/640px-Seriola_quinqueradiata_-_K%C5%8Dchi.jpg',
    catches: [],
  },
  {
    id: 27,
    name: 'ブリ (鰤)',
    description: '大きさによって呼び名が変わる出世魚。冬のブリは「寒ブリ」と呼ばれ、脂がのって非常に美味しいです。',
    habitat: '日本海や太平洋の温帯域を回遊。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Seriola_quinqueradiata_-_K%C5%8Dchi.jpg/640px-Seriola_quinqueradiata_-_K%C5%8Dchi.jpg',
    catches: [],
  },
  {
    id: 28,
    name: 'ヒラメ (平目)',
    description: 'カレイと似ていますが、目が左側にある「左ヒラメに右カレイ」。高級魚として知られ、ルアーフィッシングの好敵手です。',
    habitat: '沿岸の砂泥底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Paralichthys_olivaceus_by_OpenCage.jpg/640px-Paralichthys_olivaceus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 29,
    name: 'マゴチ (真鯒)',
    description: '大きな平たい頭と大きな口が特徴の魚。海底の砂に潜んで獲物を待ち伏せします。夏が旬の高級魚です。',
    habitat: '沿岸の砂泥底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Platycephalus_sp._2_by_OpenCage.jpg/640px-Platycephalus_sp._2_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 30,
    name: 'マダイ (真鯛)',
    description: '「魚の王様」とも呼ばれる美しい魚。お祝いの席でよく見られます。引きが強く、釣り人にとって素晴らしいターゲットです。',
    habitat: '日本各地の沿岸、岩礁域や砂礫底に生息。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Pagrus_major_by_OpenCage.jpg/640px-Pagrus_major_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 31,
    name: 'マハゼ (真鯊)',
    description: '河口や干潟などでよく見かける身近な魚。ちょい投げ釣りなどで手軽に釣れ、天ぷらにすると美味しいです。',
    habitat: '内湾や河口の砂泥底。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Acanthogobius_flavimanus_by_OpenCage.jpg/640px-Acanthogobius_flavimanus_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 32,
    name: 'メバル (眼張)',
    description: '大きな目が特徴の沿岸ロックフィッシュ。春告魚とも呼ばれ、春の釣りの始まりを告げる魚です。',
    habitat: '沿岸の岩礁域や藻場に生息。',
    defaultImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sebastes_inermis_by_OpenCage.jpg/640px-Sebastes_inermis_by_OpenCage.jpg',
    catches: [],
  },
  {
    id: 999,
    name: 'その他の魚',
    description: '図鑑にない魚はこちらに記録しましょう。メモ欄に魚の名前を書いておくと便利です。',
    habitat: 'いろいろな場所',
    defaultImageUrl: 'https://images.unsplash.com/photo-1535443120147-805b8b6a33a8?q=80&w=640',
    catches: [],
  },
];

const LOCAL_STORAGE_KEY = 'my-family-fishing-encyclopedia';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [selectedFishId, setSelectedFishId] = useState<number | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [anglers, setAnglers] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);


  // Data migration for first-time login
  useEffect(() => {
    const migrateData = async () => {
      if (!user) return;
  
      const userDocRef = db.collection('users').doc(user.uid);
      const settingsDocRef = db.collection('users').doc(user.uid).collection('settings').doc('main');
      const userDocSnap = await userDocRef.get();
  
      // If user document doesn't exist, it's their first time.
      if (!userDocSnap.exists) {
        console.log('First login for this user. Checking for local data to migrate...');
        const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const localData = JSON.parse(saved);
            const batch = db.batch();

            // Set a flag to indicate migration is done
            batch.set(userDocRef, { migrated: true, email: user.email });

            // Migrate settings
            if (localData.locations || localData.anglers) {
              batch.set(settingsDocRef, { 
                locations: localData.locations || [], 
                anglers: localData.anglers || [] 
              });
            }

            // Migrate fish and catches
            if (localData.fishes && Array.isArray(localData.fishes)) {
              localData.fishes.forEach((fish: Fish) => {
                const fishDocRef = db.collection(`users/${user.uid}/fishes`).doc(String(fish.id));
                const { catches, ...fishData } = fish;
                batch.set(fishDocRef, fishData);
                if (catches && catches.length > 0) {
                    catches.forEach((c: any) => {
                        // This part is tricky as old local data used IndexedDB keys.
                        // We will just migrate the metadata, images will be lost from old local data.
                        const catchDocRef = fishDocRef.collection('catches').doc();
                        const { imageKey, dishImageKey, ...catchData } = c;
                        batch.set(catchDocRef, {
                            ...catchData,
                            imageUrl: fish.defaultImageUrl, // Fallback image
                            // dishImageUrl will be undefined
                        });
                    });
                }
              });
            }
            await batch.commit();
            console.log('Local data migration successful!');
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch (e) {
            console.error('Failed to migrate local data:', e);
             // Still set the user doc to prevent retrying a failed migration
            await userDocRef.set({ migrated: 'failed', email: user.email });
          }
        } else {
            // No local data, just mark the user as new.
             await userDocRef.set({ migrated: false, email: user.email });
        }
      }
    };
  
    if(user){
        migrateData();
    }
  }, [user]);
  
  // Subscribe to Firestore data
  useEffect(() => {
    if (!user) {
      setFishes(initialFishData);
      setLocations([]);
      setAnglers(['パパ', 'ママ', 'お兄ちゃん', '妹']);
      setIsDataLoaded(true);
      return;
    }

    setIsDataLoaded(false);

    // This object will hold the most up-to-date data from all listeners.
    const fishDataStore: Record<number, Fish> = {};
    initialFishData.forEach(f => fishDataStore[f.id] = { ...f, catches: [] });

    // Helper to update the React state from the store
    const updateState = () => {
        setFishes(Object.values(fishDataStore));
    };

    const fishesColRef = db.collection('users').doc(user.uid).collection('fishes');

    // Listener for fish metadata
    const unsubscribeFishes = fishesColRef.onSnapshot((snapshot) => {
        let fishDataChanged = false;
        snapshot.docs.forEach(doc => {
            const fishId = parseInt(doc.id, 10);
            if (fishDataStore[fishId]) {
                const fishDocData = doc.data();
                // Check if data is actually different to prevent unnecessary updates
                if (JSON.stringify(fishDocData) !== JSON.stringify({ ...fishDataStore[fishId], catches: undefined })) {
                    Object.assign(fishDataStore[fishId], fishDocData);
                    fishDataChanged = true;
                }
            }
        });
        if (fishDataChanged) {
            updateState();
        }
        if (!isDataLoaded) setIsDataLoaded(true);
    });

    // Listeners for catches for ALL potential fish
    const catchUnsubscribers = initialFishData.map(fish => {
        const catchesColRef = fishesColRef.doc(String(fish.id)).collection('catches');
        return catchesColRef.orderBy('date', 'desc').onSnapshot(snapshot => {
            const catches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatchLog));
            if (fishDataStore[fish.id] && JSON.stringify(fishDataStore[fish.id].catches) !== JSON.stringify(catches)) {
                fishDataStore[fish.id].catches = catches;
                updateState();
            }
        });
    });

    const settingsDocRef = db.collection('users').doc(user.uid).collection('settings').doc('main');
    const unsubscribeSettings = settingsDocRef.onSnapshot((docSnap) => {
        if (docSnap.exists) {
            const settings = docSnap.data();
            setLocations(settings?.locations || []);
            setAnglers(settings?.anglers || ['パパ', 'ママ', 'お兄ちゃん', '妹']);
        } else {
            setLocations([]);
            setAnglers(['パパ', 'ママ', 'お兄ちゃん', '妹']);
        }
    });

    // Initial data load to prevent empty screen
    fishesColRef.get().then(fishesSnapshot => {
        fishesSnapshot.docs.forEach(doc => {
            const fishId = parseInt(doc.id, 10);
            if (fishDataStore[fishId]) {
                Object.assign(fishDataStore[fishId], doc.data());
            }
        });
        updateState();
        setIsDataLoaded(true);
    });


    return () => {
      unsubscribeFishes();
      unsubscribeSettings();
      catchUnsubscribers.forEach(unsub => unsub());
    };
  }, [user]);


  const sortedFishes = useMemo(() => 
    [...fishes].sort((a, b) => {
      if (a.id === 999) return 1;
      if (b.id === 999) return -1;
      return a.id - b.id;
    }), [fishes]);

  const selectedFish = useMemo(() => 
    selectedFishId ? fishes.find(f => f.id === selectedFishId) ?? null : null,
    [fishes, selectedFishId]
  );
  
  const handleSelectFish = useCallback((fish: Fish) => {
    setSelectedFishId(fish.id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedFishId(null);
  }, []);
  
  const updateSettings = async (type: 'locations' | 'anglers', value: string) => {
    if (!user) return;
    const settingsDocRef = db.collection('users').doc(user.uid).collection('settings').doc('main');
    const newItems = type === 'locations' ? [...locations, value] : [...anglers, value];
    await settingsDocRef.set({ [type]: newItems }, { merge: true });
  };

  const handleAddLocation = useCallback((newLocation: string) => {
    if (newLocation && !locations.includes(newLocation)) {
      updateSettings('locations', newLocation);
    }
  }, [locations, user]);

  const handleAddAngler = useCallback((newAngler: string) => {
    if (newAngler && !anglers.includes(newAngler)) {
        updateSettings('anglers', newAngler);
    }
  }, [anglers, user]);
  
  const handleCatchUpdate = async (fishId: number, updateFn: (batch: firebase.firestore.WriteBatch, fishDocRef: firebase.firestore.DocumentReference) => void) => {
    if (!user) {
        alert("ログインしてください。");
        return;
    }
    const fishDocRef = db.collection(`users/${user.uid}/fishes`).doc(String(fishId));
    const batch = db.batch();
    
    // Ensure the fish document exists before adding a catch to it
    const fishDocSnap = await fishDocRef.get();
    if (!fishDocSnap.exists) {
        const fishData = initialFishData.find(f => f.id === fishId);
        if (fishData) {
            const { catches, ...baseFishData } = fishData;
            batch.set(fishDocRef, baseFishData);
        }
    }

    updateFn(batch, fishDocRef);
    await batch.commit();
  };

  const handleAddCatch = useCallback((fishId: number, newCatch: Omit<CatchLog, 'id'>) => {
      handleCatchUpdate(fishId, (batch, fishDocRef) => {
        const catchDocRef = fishDocRef.collection('catches').doc();
        batch.set(catchDocRef, newCatch);
        const fishToUpdate = fishes.find(f => f.id === fishId);
        if (!fishToUpdate?.coverImageCatchId) {
             batch.update(fishDocRef, { coverImageCatchId: catchDocRef.id });
        }
      });
  }, [user, fishes]);

  const handleEditCatch = useCallback((fishId: number, updatedCatch: CatchLog) => {
      handleCatchUpdate(fishId, (batch, fishDocRef) => {
        const catchDocRef = fishDocRef.collection('catches').doc(updatedCatch.id);
        const { id, ...catchData } = updatedCatch;
        batch.update(catchDocRef, catchData);
      });
  }, [user]);

  const handleDeleteCatch = useCallback((fishId: number, catchId: string) => {
      handleCatchUpdate(fishId, (batch, fishDocRef) => {
        const catchDocRef = fishDocRef.collection('catches').doc(catchId);
        batch.delete(catchDocRef);

        const fish = fishes.find(f => f.id === fishId);
        if (fish?.coverImageCatchId === catchId) {
            const newCoverId = fish.catches.filter(c => c.id !== catchId)[0]?.id || null;
            batch.update(fishDocRef, { coverImageCatchId: newCoverId });
        }
      });
  }, [user, fishes]);
  
  const handleSetCoverImage = useCallback((fishId: number, catchId: string) => {
      handleCatchUpdate(fishId, (batch, fishDocRef) => {
          batch.update(fishDocRef, { coverImageCatchId: catchId });
      });
  }, [user]);
  
  if (loading || (user && !isDataLoaded)) {
    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center">
            <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg font-semibold text-gray-700">データを読み込んでいます...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {!user && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow" role="alert">
                <p className="font-bold">データを保存・同期するにはログインしてください</p>
                <p className="text-sm">Googleアカウントでログインすると、釣果が自動でクラウドに保存され、他のスマホやPCからも見れるようになります。</p>
            </div>
        )}
        <EncyclopediaProgress 
          fishes={fishes} 
        />
        <div className="my-6 md:my-8">
          <Ranking fishes={fishes} />
        </div>
        <FishGrid fishes={sortedFishes} onSelectFish={handleSelectFish} />
      </main>
      
      {selectedFish && (
        <FishDetailModal
          fish={selectedFish}
          onClose={handleCloseModal}
          onAddCatch={handleAddCatch}
          onEditCatch={handleEditCatch}
          onDeleteCatch={handleDeleteCatch}
          onSetCoverImage={handleSetCoverImage}
          locations={locations}
          onAddLocation={handleAddLocation}
          anglers={anglers}
          onAddAngler={handleAddAngler}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
};

export default App;
