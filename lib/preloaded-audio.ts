
export const PRELOADED_PODCAST_URLS: { url: string; collectionName?: string }[] = [
  // JP Foundation (87 files)
  ...Array.from({ length: 87 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/${i + 1}.mp3`,
    collectionName: 'JP Foundation',
  })),

  // JP Advanced (CD1: 14, CD2: 11, CD3: 12, CD4: 10)
  ...Array.from({ length: 14 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/Japanese%20Advanced%20CD1-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/Japanese%20Advanced%20CD2-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/Japanese%20Advanced%20CD3-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/Japanese%20Advanced%20CD4-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  
  // Japanese I (30 files)
  ...Array.from({ length: 30 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/japanese%20i/${i + 1}.mp3`,
    collectionName: 'Japanese I',
  })),

  // NL Foundation (CD1: 14, CD2: 12, CD3: 12, CD4: 10, CD5: 11, CD6: 11, CD7: 12, CD8: 12)
  ...Array.from({ length: 14 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD1-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD2-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD3-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD4-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD5-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD6-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD7-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/Dutch%20Foundation%20CD8-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  
  // NL Advanced (CD1: 16, CD2: 16, CD3: 16, CD4: 14)
  ...Array.from({ length: 16 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-Adv/Dutch%20Advanced%20CD1-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-Adv/Dutch%20Advanced%20CD2-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-Adv/Dutch%20Advanced%20CD3-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  ...Array.from({ length: 14 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-Adv/Dutch%20Advanced%20CD4-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  
  // Chinese V (30 files)
  ...Array.from({ length: 30 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/zh-v/Mandarin%20Chinese%20V%20-%20Unit%20${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'Chinese V',
  })),

  // Italian I (30 files)
  ...Array.from({ length: 30 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/italian%20i/Pimsleur%20Italian%201%20-%20Unit%20${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'Italian I',
  })),
  
  // Spanish I (30 files)
    ...Array.from({ length: 30 }, (_, i) => ({
        url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/spanish%20i/${i + 1}.mp3`,
        collectionName: 'Spanish I',
    })),
];
