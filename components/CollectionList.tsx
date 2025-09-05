
import React, { useMemo } from 'react';
import type { Podcast, Collection, Theme } from '../types';
import CollectionItem from './CollectionItem';

interface CollectionListProps {
  collections: Collection[];
  podcasts: Podcast[];
  onNavigateToCollection: (id: string) => void;
  onPlayCollection: (id: string | null) => void;
  onRenameCollection: (id: string, newName: string) => void;
  onDeleteCollection: (id: string) => void;
  onResetCollectionProgress: (collectionId: string) => void;
  onSetCollectionArtwork: (collectionId: string, url: string | null) => void;
  theme: Theme;
}

const CollectionList: React.FC<CollectionListProps> = (props) => {
  const { collections, podcasts, onNavigateToCollection, onPlayCollection, onRenameCollection, onDeleteCollection, onResetCollectionProgress, onSetCollectionArtwork, theme } = props;
  
  const collectionsWithStats = useMemo(() => {
    // Map to store stats: { total: number, listened: number }
    const statsMap = new Map<string | null, { total: number; listened: number }>();
    
    // Populate stats map from all podcasts
    podcasts.forEach(p => {
      const stats = statsMap.get(p.collectionId) || { total: 0, listened: 0 };
      stats.total++;
      if (p.isListened) {
        stats.listened++;
      }
      statsMap.set(p.collectionId, stats);
    });

    // Process regular collections
    const processedCollections = collections.map(collection => {
      const stats = statsMap.get(collection.id) || { total: 0, listened: 0 };
      return {
        ...collection,
        podcastCount: stats.total,
        completionPercentage: stats.total > 0 ? (stats.listened / stats.total) * 100 : 0,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Process uncategorized podcasts
    const uncategorizedStats = statsMap.get(null) || { total: 0, listened: 0 };
    if (uncategorizedStats.total > 0) {
      processedCollections.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        artworkUrl: undefined,
        podcastCount: uncategorizedStats.total,
        completionPercentage: (uncategorizedStats.listened / uncategorizedStats.total) * 100,
      });
    }

    return processedCollections;
  }, [collections, podcasts]);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {collectionsWithStats.map((collection, index) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              onNavigate={() => onNavigateToCollection(collection.id)}
              onPlay={() => onPlayCollection(collection.id === 'uncategorized' ? null : collection.id)}
              onRename={(newName) => onRenameCollection(collection.id, newName)}
              onDelete={() => onDeleteCollection(collection.id)}
              onResetProgress={() => onResetCollectionProgress(collection.id)}
              onSetArtwork={onSetCollectionArtwork}
              style={{ animationDelay: `${index * 50}ms` }}
              theme={theme}
            />
        ))}
    </div>
  );
};
export default CollectionList;