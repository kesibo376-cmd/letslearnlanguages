

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
  onResetCollectionProgress: (collectionId: string | null) => void;
  onSetCollectionArtwork: (collectionId: string, url: string | null) => void;
  lastPlayedCollectionId: string | null;
  theme: Theme;
}

const CollectionList: React.FC<CollectionListProps> = (props) => {
  const { collections, podcasts, onNavigateToCollection, onPlayCollection, onRenameCollection, onDeleteCollection, onResetCollectionProgress, onSetCollectionArtwork, theme, lastPlayedCollectionId } = props;
  
  const uncategorizedPodcasts = useMemo(() => {
    return podcasts.filter(p => p.collectionId === null);
  }, [podcasts]);
  
  const collectionsWithStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; listened: number }>();
    podcasts.forEach(p => {
        if (p.collectionId) {
            const stats = statsMap.get(p.collectionId) || { total: 0, listened: 0 };
            stats.total += 1;
            if (p.isListened) {
                stats.listened += 1;
            }
            statsMap.set(p.collectionId, stats);
        }
    });

    return collections
      .map(collection => {
          const stats = statsMap.get(collection.id) || { total: 0, listened: 0 };
          return {
              ...collection,
              podcastCount: stats.total,
              completionPercentage: stats.total > 0 ? (stats.listened / stats.total) * 100 : 0
          };
      });
  }, [collections, podcasts]);

  const totalUncategorized = uncategorizedPodcasts.length;
  const listenedUncategorized = uncategorizedPodcasts.filter(p => p.isListened).length;
  const uncategorizedCollection = {
      id: 'uncategorized',
      name: 'Uncategorized',
      podcastCount: uncategorizedPodcasts.length,
      completionPercentage: totalUncategorized > 0 ? (listenedUncategorized / totalUncategorized) * 100 : 0,
  };
  
  const allItems = useMemo(() => {
      const unsortedItems = [...collectionsWithStats];
      if (uncategorizedPodcasts.length > 0) {
        unsortedItems.push(uncategorizedCollection);
      }

      return unsortedItems.sort((a, b) => {
          const aId = a.id === 'uncategorized' ? null : a.id;
          const bId = b.id === 'uncategorized' ? null : b.id;

          const isALastPlayed = aId === lastPlayedCollectionId;
          const isBLastPlayed = bId === lastPlayedCollectionId;

          if (isALastPlayed && !isBLastPlayed) return -1;
          if (!isALastPlayed && isBLastPlayed) return 1;

          if (a.id === 'uncategorized') return 1;
          if (b.id === 'uncategorized') return -1;

          return a.name.localeCompare(b.name);
      });
  }, [collectionsWithStats, uncategorizedPodcasts.length, lastPlayedCollectionId]);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {allItems.map((collection, index) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              onNavigate={() => onNavigateToCollection(collection.id)}
              onPlay={() => onPlayCollection(collection.id === 'uncategorized' ? null : collection.id)}
              onRename={(newName) => onRenameCollection(collection.id, newName)}
              onDelete={() => onDeleteCollection(collection.id)}
              onResetProgress={() => onResetCollectionProgress(collection.id === 'uncategorized' ? null : collection.id)}
              onSetArtwork={onSetCollectionArtwork}
              theme={theme}
              style={{ animationDelay: `${index * 50}ms` }}
            />
        ))}
    </div>
  );
};
export default CollectionList;
