'use client';

import { useState, useCallback } from 'react';
import {
  History,
  User,
  Calendar,
  AlertTriangle,
  Trophy,
  Flag,
  CloudRain,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getCircuitHistory, type CircuitHistoryImage } from '@/lib/constants/circuit-history';

// Component to handle image loading with error fallback
function HistoricImageThumbnail({
  image,
  onClick,
  onError,
}: {
  image: CircuitHistoryImage;
  onClick: () => void;
  onError: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null; // Don't render broken images
  }

  return (
    <button
      onClick={onClick}
      className="group relative aspect-video overflow-hidden rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
    >
      <img
        src={image.url}
        alt={image.alt}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => {
          setHasError(true);
          onError();
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-medium line-clamp-2">{image.caption}</p>
          {image.year && (
            <Badge variant="secondary" className="mt-1 text-xs">{image.year}</Badge>
          )}
        </div>
      </div>
    </button>
  );
}

interface TrackHistoryProps {
  circuitSlug: string;
  className?: string;
}

const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: typeof Trophy; color: string; bgColor: string }
> = {
  tragedy: { icon: AlertTriangle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  classic: { icon: Trophy, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  first: { icon: Flag, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  last: { icon: Flag, color: 'text-zinc-400', bgColor: 'bg-zinc-500/10' },
  record: { icon: Trophy, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  controversy: { icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  weather: { icon: CloudRain, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
};

export function TrackHistory({ circuitSlug, className = '' }: TrackHistoryProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const history = getCircuitHistory(circuitSlug);

  // Filter out failed images
  const workingImages = history.historicImages?.filter((_, idx) => !failedImages.has(idx)) || [];

  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
  }, []);

  const openImageModal = (index: number) => {
    // Find the actual index in the working images
    const workingIndex = workingImages.findIndex((img) =>
      history.historicImages?.indexOf(img) === index
    );
    if (workingIndex !== -1) {
      setSelectedImageIndex(workingIndex);
    }
  };
  const closeImageModal = () => setSelectedImageIndex(null);
  const nextImage = () => {
    if (selectedImageIndex !== null && workingImages.length > 0) {
      setSelectedImageIndex((selectedImageIndex + 1) % workingImages.length);
    }
  };
  const prevImage = () => {
    if (selectedImageIndex !== null && workingImages.length > 0) {
      setSelectedImageIndex((selectedImageIndex - 1 + workingImages.length) % workingImages.length);
    }
  };

  if (!history || history === getCircuitHistory('default')) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-zinc-500 py-8">
            <History className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Detailed history not yet available for this circuit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleEvents = showAllEvents
    ? history.significantEvents
    : history.significantEvents.slice(0, 4);

  const selectedImage = selectedImageIndex !== null && workingImages.length > 0
    ? workingImages[selectedImageIndex]
    : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeImageModal}
        >
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {workingImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          <div
            className="max-w-5xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 min-h-0 flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  // Replace with placeholder on error
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-white text-lg">{selectedImage.caption}</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                {selectedImage.year && (
                  <Badge variant="secondary">{selectedImage.year}</Badge>
                )}
                {selectedImage.credit && (
                  <span className="text-zinc-500 text-sm">{selectedImage.credit}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historic Photos Gallery */}
      {history.historicImages && history.historicImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-emerald-500" />
              Historic Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {history.historicImages.map((image, idx) => (
                <HistoricImageThumbnail
                  key={idx}
                  image={image}
                  onClick={() => openImageModal(idx)}
                  onError={() => handleImageError(idx)}
                />
              ))}
            </div>
            {workingImages.length > 0 && (
              <p className="text-zinc-500 text-xs mt-3 text-center">Click any photo to enlarge</p>
            )}
            {workingImages.length === 0 && history.historicImages.length > 0 && (
              <div className="text-center py-4">
                <ImageOff className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-zinc-500 text-sm">Historic photos unavailable</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Designer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-500" />
            Circuit Designer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-zinc-700">
              <User className="h-8 w-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{history.designer.name}</h3>
              {history.designer.firm && (
                <p className="text-zinc-400">{history.designer.firm}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {history.designer.year}
                </Badge>
                {history.lastMajorChange && history.lastMajorChange !== history.designer.year && (
                  <Badge variant="secondary">
                    Last update: {history.lastMajorChange}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Redesigns Timeline */}
          {history.designer.redesigns && history.designer.redesigns.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">Circuit Evolution</h4>
              <div className="space-y-3">
                {history.designer.redesigns.map((redesign, idx) => (
                  <div
                    key={redesign.year}
                    className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-blue-500"
                  >
                    <div className="text-sm">
                      <span className="font-bold text-white">{redesign.year}</span>
                      <span className="text-zinc-400 ml-2">{redesign.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Significant Events */}
      {history.significantEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-yellow-500" />
              Historic Moments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visibleEvents.map((event, idx) => {
                const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.classic;
                const Icon = config.icon;

                return (
                  <div
                    key={`${event.year}-${idx}`}
                    className={`rounded-lg border border-zinc-800 p-4 ${config.bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-1 ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {event.year}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs capitalize ${config.color}`}
                          >
                            {event.type}
                          </Badge>
                        </div>
                        <h4 className="text-white font-semibold mt-1">{event.title}</h4>
                        <p className="text-zinc-400 text-sm mt-1">{event.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {history.significantEvents.length > 4 && (
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="mt-4 w-full py-2 px-4 rounded-lg border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2 text-sm text-zinc-400"
              >
                {showAllEvents ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show All {history.significantEvents.length} Events
                  </>
                )}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Did You Know */}
      {history.facts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Did You Know?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {history.facts.map((fact, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-zinc-300 text-sm"
                >
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* First Football Match */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">First Football Match</p>
              <p className="text-3xl font-bold text-white">{history.firstF1Race}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">Years of Football</p>
              <p className="text-3xl font-bold text-emerald-500">
                {new Date().getFullYear() - history.firstF1Race}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
