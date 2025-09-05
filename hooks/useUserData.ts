import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Podcast, Collection, Theme, StreakData, CompletionSound, LayoutMode } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const PRELOADED_PODCAST_URLS: { url: string; collectionName?: string }[] = [
  { url: 'https://cheery-mooncake-49edfd.netlify.app/1.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/2.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/3.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/4.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/5.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/6.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/7.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/8.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/9.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/10.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/11.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/12.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/13.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/14.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/15.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/16.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/17.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/18.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/19.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/20.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/21.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/22.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/23.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/24.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/25.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/26.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/27.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/28.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/29.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/30.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/31.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/32.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/33.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/34.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/35.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/36.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/37.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/38.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/39.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/40.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/41.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/42.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/43.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/44.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/45.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/46.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/47.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/48.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/49.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/50.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/51.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/52.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/53.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/54.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/55.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/56.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/57.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/58.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/59.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/60.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/61.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/62.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/63.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/64.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/65.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/66.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/67.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/68.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/69.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/70.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/71.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/72.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/73.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/74.mp3', collectionName: 'JP Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/75.mp3', collectionName: 'JP Foundation' },
  // CD1 (01–14)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-01.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-02.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-03.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-04.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-05.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-06.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-07.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-08.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-09.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-10.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-11.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-12.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-13.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd1-14.mp3', collectionName: 'JP Advanced' },

  // CD2 (01–11)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-01.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-02.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-03.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-04.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-05.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-06.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-07.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-08.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-09.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-10.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd2-11.mp3', collectionName: 'JP Advanced' },

  // CD3 (01–12)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-01.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-02.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-03.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-04.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-05.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-06.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-07.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-08.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-09.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-10.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-11.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd3-12.mp3', collectionName: 'JP Advanced' },

  // CD4 (01–10)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-01.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-02.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-03.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-04.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-05.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-06.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-07.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-08.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-09.mp3', collectionName: 'JP Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/adv/japanese%20advanced%20cd4-10.mp3', collectionName: 'JP Advanced' },
  
  // CD1 (01–14) - Dutch
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-11.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-12.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-13.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd1-14.mp3', collectionName: 'NL Foundation' },

  // CD2 (01–12)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-11.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd2-12.mp3', collectionName: 'NL Foundation' },

  // CD3 (01–12)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-11.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd3-12.mp3', collectionName: 'NL Foundation' },

  // CD4 (01–10)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd4-10.mp3', collectionName: 'NL Foundation' },

  // CD5 (01–11)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd5-11.mp3', collectionName: 'NL Foundation' },

  // CD6 (01–11)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd6-11.mp3', collectionName: 'NL Foundation' },

  // CD7 (01–12)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-11.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd7-12.mp3', collectionName: 'NL Foundation' },

  // CD8 (01–12)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-01.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-02.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-03.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-04.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-05.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-06.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-07.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-08.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-09.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-10.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-11.mp3', collectionName: 'NL Foundation' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch/dutch%20foundation%20cd8-12.mp3', collectionName: 'NL Foundation' },
  
  // NL Advanced - CD1 (01–16)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-01.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-02.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-03.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-04.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-05.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-06.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-07.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-08.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-09.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-10.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-11.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-12.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-13.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-14.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-15.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd1-16.mp3', collectionName: 'NL Advanced' },

  // NL Advanced - CD2 (01–16)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-01.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-02.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-03.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-04.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-05.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-06.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-07.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-08.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-09.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-10.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-11.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-12.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-13.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-14.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-15.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd2-16.mp3', collectionName: 'NL Advanced' },

  // NL Advanced - CD3 (01–16)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-01.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-02.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-03.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-04.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-05.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-06.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-07.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-08.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-09.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-10.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-11.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-12.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-13.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-14.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-15.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd3-16.mp3', collectionName: 'NL Advanced' },

  // NL Advanced - CD4 (01–14)
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-01.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-02.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-03.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-04.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-05.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-06.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-07.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-08.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-09.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-10.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-11.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-12.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-13.mp3', collectionName: 'NL Advanced' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/dutch-adv/dutch%20advanced%20cd4-14.mp3', collectionName: 'NL Advanced' },
  
  // Chinese V
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2001.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2002.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2003.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2004.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2005.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2006.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2007.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2008.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2009.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2010.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2011.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2012.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2013.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2014.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2015.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2016.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2017.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2018.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2019.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2020.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2021.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2022.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2023.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2024.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2025.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2026.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2027.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2028.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2029.mp3', collectionName: 'Chinese V' },
  { url: 'https://cheery-mooncake-49edfd.netlify.app/zh-v/mandarin%20chinese%20v%20-%20unit%2030.mp3', collectionName: 'Chinese V' },
];

const DEFAULT_STREAK_DATA: StreakData = {
  enabled: true,
  lastListenDate: null,
  currentStreak: 0,
  difficulty: 'normal',
  completionDate: null,
  completedToday: [],
  history: [],
};

export const getDefaultData = () => {
    const collectionCounters: { [key: string]: number } = {};

    const podcasts = PRELOADED_PODCAST_URLS.map((item, index) => {
        let podcastName = `Audio ${index + 1}`; // Fallback name
        if (item.collectionName) {
            collectionCounters[item.collectionName] = (collectionCounters[item.collectionName] || 0) + 1;
            podcastName = `${item.collectionName} ${collectionCounters[item.collectionName]}`;
        }
        return {
            id: `preloaded-${index}`,
            name: podcastName,
            url: item.url,
            duration: 0,
            progress: 0,
            isListened: false,
            storage: 'preloaded' as const,
            collectionId: item.collectionName ? item.collectionName.toLowerCase().replace(/\s+/g, '-') : null,
        };
    });

    const collections = PRELOADED_PODCAST_URLS
        .filter(p => p.collectionName)
        .map(p => ({ id: p.collectionName!.toLowerCase().replace(/\s+/g, '-'), name: p.collectionName! }))
        .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    
    return {
        podcasts,
        collections,
        title: 'My Audio Library',
        theme: 'charcoal' as Theme,
        layoutMode: 'default' as LayoutMode,
        streakData: DEFAULT_STREAK_DATA,
        hideCompleted: false,
        reviewModeEnabled: false,
        completionSound: 'minecraft' as CompletionSound,
        useCollectionsView: true,
        playOnNavigate: false,
        hasCompletedOnboarding: false,
        customArtwork: null,
    };
};


export function useUserData(userId?: string) {
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);

    useEffect(() => {
        if (!userId) {
            setData(null);
            setIsDataLoading(false);
            return;
        }

        const docRef = doc(db, 'users', userId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                let userData = docSnap.data();
                const defaultData = getDefaultData();
                let needsUpdate = false;

                // --- MIGRATION LOGIC FOR EXISTING USERS ---

                // 1. Add missing preloaded collections
                const existingCollectionIds = new Set((userData.collections || []).map((c: Collection) => c.id));
                const missingCollections = defaultData.collections.filter(c => !existingCollectionIds.has(c.id));
                if (missingCollections.length > 0) {
                    userData.collections = [...(userData.collections || []), ...missingCollections];
                    needsUpdate = true;
                }
                
                // 2. Add missing preloaded podcasts and update names of existing ones
                const defaultPodcastMap = new Map(defaultData.podcasts.map(p => [p.id, p]));
                
                const existingPreloadedPodcastIds = new Set(
                    (userData.podcasts || []).filter((p: Podcast) => p.storage === 'preloaded').map((p: Podcast) => p.id)
                );
                const missingPodcasts = defaultData.podcasts.filter(p => !existingPreloadedPodcastIds.has(p.id));

                let podcastsUpdated = false;
                const correctedPodcasts = (userData.podcasts || []).map((p: Podcast) => {
                    if (p.storage === 'preloaded') {
                        const defaultVersion = defaultPodcastMap.get(p.id);
                        if (defaultVersion && p.name !== defaultVersion.name) {
                            podcastsUpdated = true;
                            return { ...p, name: defaultVersion.name };
                        }
                    }
                    return p;
                });
                
                if (missingPodcasts.length > 0 || podcastsUpdated) {
                    userData.podcasts = [...correctedPodcasts, ...missingPodcasts];
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    // Update Firestore without waiting for the result to keep UI responsive
                    updateDoc(docRef, {
                        podcasts: userData.podcasts,
                        collections: userData.collections
                    }).catch(err => console.error("Error migrating user data:", err));
                }
                
                setData(userData);

            } else {
                // User document doesn't exist, so this is a new user.
                // The signup function in AuthContext will create the initial document.
                console.log("No user data found for UID:", userId);
                setData(null); // Or some indicator that it's a new user
            }
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [userId]);
    
    const updateUserData = useCallback(async (updates: Partial<any> | null) => {
        if (!userId) return;
        const docRef = doc(db, 'users', userId);
        try {
            if (updates === null) {
              // A null update means reset the user's data to default
              await setDoc(docRef, getDefaultData());
            } else {
              // Using updateDoc directly is simpler and more robust for offline scenarios.
              // It will fail if the document doesn't exist, but that's the correct
              // behavior for an update. We handle that failure below.
              await updateDoc(docRef, updates);
            }
        } catch (error) {
            console.error("Error updating user data:", error);
            // If update fails because doc doesn't exist (e.g. race condition on signup),
            // we can try to create it with the merged data as a fallback.
            if (error instanceof Error && 'code' in error && (error as any).code === 'not-found') {
                console.log("Document not found, creating it with merged data.");
                try {
                    await setDoc(docRef, { ...getDefaultData(), ...updates });
                } catch (e) {
                    console.error("Error creating document after update failed:", e);
                }
            }
        }
    }, [userId]);
    
    const defaultData = useMemo(() => getDefaultData(), []);
    const loadedData = data || defaultData;

    const podcasts = loadedData.podcasts;
    const collections = loadedData.collections;
    const title = loadedData.title;
    const theme = loadedData.theme;
    const layoutMode = loadedData.layoutMode;
    const streakData = loadedData.streakData;
    const hideCompleted = loadedData.hideCompleted;
    const reviewModeEnabled = loadedData.reviewModeEnabled;
    const completionSound = loadedData.completionSound;
    const useCollectionsView = loadedData.useCollectionsView;
    const playOnNavigate = loadedData.playOnNavigate;
    const hasCompletedOnboarding = loadedData.hasCompletedOnboarding;
    const customArtwork = loadedData.customArtwork;
    
    const totalStorageUsed = useMemo(() => {
        if (podcasts) {
            return podcasts
                .filter((p: Podcast) => p.storage === 'indexeddb' && typeof p.size === 'number')
                .reduce((acc: number, p: Podcast) => acc + p.size!, 0);
        }
        return 0;
    }, [podcasts]);

    return {
        data: loadedData,
        updateUserData,
        podcasts,
        collections,
        title,
        theme,
        layoutMode,
        streakData,
        hideCompleted,
        reviewModeEnabled,
        completionSound,
        useCollectionsView,
        playOnNavigate,
        hasCompletedOnboarding,
        isDataLoading,
        totalStorageUsed,
        customArtwork,
    };
}