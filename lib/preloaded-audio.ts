export const PRELOADED_PODCAST_URLS: { url: string; collectionName?: string }[] = [
  // JP Foundation (75 files)
  ...Array.from({ length: 75 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/${i + 1}.mp3`,
    collectionName: 'JP Foundation',
  })),

  // JP Advanced (CD1: 14, CD2: 11, CD3: 12, CD4: 10)
  ...Array.from({ length: 14 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/japanese%20advanced%20cd1-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/japanese%20advanced%20cd2-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/japanese%20advanced%20cd3-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/adv/japanese%20advanced%20cd4-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'JP Advanced',
  })),
  
  // Japanese I (30 files)
  ...Array.from({ length: 30 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/japanese%20i/japanese%20i%20[3rd%20ed]%20-%20lesson%20${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'Japanese I',
  })),

  // NL Foundation (CD1: 14, CD2: 12, CD3: 12, CD4: 10, CD5: 11, CD6: 11, CD7: 12, CD8: 12)
  ...Array.from({ length: 14 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd1-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd2-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd3-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd4-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd5-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd6-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd7-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch/dutch%20foundation%20cd8-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Foundation',
  })),
  
  // NL Advanced (CD1: 16, CD2: 16, CD3: 16, CD4: 14)
  ...Array.from({ length: 16 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-adv/dutch%20advanced%20cd1-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-adv/dutch%20advanced%20cd2-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-adv/dutch%20advanced%20cd3-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  ...Array.from({ length: 14 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/dutch-adv/dutch%20advanced%20cd4-${String(i + 1).padStart(2, '0')}.mp3`,
    collectionName: 'NL Advanced',
  })),
  
  // Chinese V (30 files)
  ...Array.from({ length: 30 }, (_, i) => ({
    url: `https://pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev/zh-v/mandarin%20chinese%20v%20-%20unit%20${String(i + 1).padStart(2, '0')}.mp3`,
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