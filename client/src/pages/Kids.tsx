import { useState, useEffect, useRef } from 'react';
import { usePageTracker } from '@/hooks/usePageTracker';
import { useExitTracker } from '@/hooks/useExitTracker';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, ChevronLeft, ChevronRight, Star, BookOpen, Volume2, VolumeX, Pause, Play, Video, Search, X, ListMusic, SkipForward, SkipBack } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { childrenStoriesData, type ChildrenStory } from '@/lib/children-stories-data';
import { YouTubeCard } from '@/components/YouTubeCard';
import { getStoryAudioFile } from '@/lib/stories-audio-mapping';
import { kidsBibleVideos, videoCategories, getYouTubeThumbnail, searchVideos, kidsHymnsPlaylist, type KidsVideo } from '@/lib/kids-bible-videos-data';
import { SEOHead } from '@/components/SEOHead';
import { getVideoSchema } from '@/lib/seo-config';

function ImageSlider({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
        <span className="text-6xl">📖</span>
      </div>
    );
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full" dir="rtl">
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title} - صورة ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            loading="lazy"
          />
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
              data-testid="button-prev-image"
            >
              <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
            <button
              onClick={goToNext}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
              data-testid="button-next-image"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-purple-500'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              data-testid={`dot-${index}`}
            />
          ))}
        </div>
      )}
      
      <p className="text-center text-sm text-muted-foreground mt-2">
        صورة {currentIndex + 1} من {images.length}
      </p>
    </div>
  );
}

function StoryAudioPlayer({ storyId }: { storyId: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFile = getStoryAudioFile(storyId);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [storyId]);

  if (!audioFile) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <VolumeX className="w-4 h-4" />
        <span>الصوت غير متاح لهذه القصة</span>
      </div>
    );
  }

  const handlePlay = () => {
    try {
      if (isPaused && audioRef.current) {
        audioRef.current.play().catch(() => {});
        setIsPaused(false);
        setIsPlaying(true);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioFile);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      audio.play().catch(() => {
        setIsPlaying(false);
        setIsPaused(false);
      });
    } catch (e) {
      console.log("Audio play error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="flex gap-2">
      {!isPlaying ? (
        <Button
          onClick={handlePlay}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          data-testid="button-listen"
        >
          <Volume2 className="w-5 h-5 ml-2" />
          {isPaused ? 'متابعة الاستماع' : 'استمع للقصة'}
        </Button>
      ) : (
        <>
          <Button
            onClick={handlePause}
            variant="secondary"
            className="flex-1"
            data-testid="button-pause"
          >
            <Pause className="w-5 h-5 ml-2" />
            إيقاف مؤقت
          </Button>
          <Button
            onClick={handleStop}
            variant="outline"
            data-testid="button-stop"
          >
            <VolumeX className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
}

export default function Kids() {
  usePageTracker('/kids');
  useExitTracker('/kids');
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<KidsVideo | null>(null);
  const [videoSearch, setVideoSearch] = useState('');
  const [playlistActive, setPlaylistActive] = useState(false);
  const [playlistIndex, setPlaylistIndex] = useState(0);

  const openVideo = (video: KidsVideo, inPlaylist = false) => {
    setSelectedVideo(video);
    setPlaylistActive(inPlaylist);
    if (inPlaylist) {
      const idx = kidsHymnsPlaylist.findIndex(h => h.id === video.id);
      setPlaylistIndex(idx >= 0 ? idx : 0);
    }
  };

  const startPlaylist = () => {
    setPlaylistIndex(0);
    setSelectedVideo(kidsHymnsPlaylist[0]);
    setPlaylistActive(true);
  };

  const goNextPlaylist = () => {
    const next = playlistIndex + 1;
    if (next < kidsHymnsPlaylist.length) {
      setPlaylistIndex(next);
      setSelectedVideo(kidsHymnsPlaylist[next]);
    }
  };

  const goPrevPlaylist = () => {
    const prev = playlistIndex - 1;
    if (prev >= 0) {
      setPlaylistIndex(prev);
      setSelectedVideo(kidsHymnsPlaylist[prev]);
    }
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setPlaylistActive(false);
  };

  const story = childrenStoriesData.find(s => s.id === selectedStory);
  const filteredVideos = searchVideos(videoSearch);
  
  const videoSchema = getVideoSchema(kidsBibleVideos.map(v => ({
    id: v.id,
    title: v.title,
    youtubeId: v.youtubeId,
    description: v.title
  })));

  const getNextStory = () => {
    if (!story) return;
    const currentIndex = childrenStoriesData.findIndex(s => s.id === story.id);
    if (currentIndex < childrenStoriesData.length - 1) {
      setSelectedStory(childrenStoriesData[currentIndex + 1].id);
    } else {
      setSelectedStory(childrenStoriesData[0].id);
    }
  };

  const getPrevStory = () => {
    if (!story) return;
    const currentIndex = childrenStoriesData.findIndex(s => s.id === story.id);
    if (currentIndex > 0) {
      setSelectedStory(childrenStoriesData[currentIndex - 1].id);
    } else {
      setSelectedStory(childrenStoriesData[childrenStoriesData.length - 1].id);
    }
  };


  return (
    <>
      <SEOHead customSchema={videoSchema} />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">قسم الأطفال</h1>
            <p className="text-sm text-muted-foreground">قصص وفيديوهات من الكتاب المقدس للأطفال</p>
          </div>
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 h-14">
            <TabsTrigger value="videos" className="text-base py-3" data-testid="tab-videos">
              <Video className="w-5 h-5 ml-2" />
              فيديوهات
            </TabsTrigger>
            <TabsTrigger value="stories" className="text-base py-3" data-testid="tab-stories">
              <BookOpen className="w-5 h-5 ml-2" />
              قصص مصورة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories">
            <AnimatePresence mode="wait">
              {!selectedStory ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-foreground">اختر قصة ({childrenStoriesData.length} قصص)</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {childrenStoriesData.map((story, index) => (
                      <motion.div
                        key={story.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                          onClick={() => setSelectedStory(story.id)}
                          data-testid={`story-card-${story.id}`}
                        >
                          <div className="h-40 overflow-hidden">
                            <img
                              src={story.images[0]}
                              alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-display text-lg font-bold text-foreground">
                                {story.title}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {story.ageGroup}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {story.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <BookOpen className="w-3 h-3" />
                              <span>{story.bibleReference}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-muted/30 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">
                      المحتوى مقتبس من Open Bible Stories (CC BY-SA 4.0)
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStory(null);
                    }}
                    className="mb-4"
                    data-testid="button-back-stories"
                  >
                    <ChevronLeft className="w-4 h-4 ml-1" />
                    رجوع للقصص
                  </Button>

                  {story && (
                    <Card className="overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <ImageSlider images={story.images} title={story.title} />
                        
                        <div className="mt-6">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-display text-2xl font-bold text-foreground">
                              {story.title}
                            </h2>
                            <Badge variant="secondary">{story.ageGroup}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                            <BookOpen className="w-4 h-4" />
                            <span>{story.bibleReference}</span>
                          </div>

                          <p className="text-lg text-muted-foreground mb-6">{story.summary}</p>

                          <div className="mb-6">
                            <StoryAudioPlayer storyId={story.id} />
                          </div>

                          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <span className="font-semibold text-foreground">القصة</span>
                            </div>
                            <div className="font-display text-lg leading-loose text-foreground whitespace-pre-line">
                              {story.content}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              className="flex-1" 
                              onClick={getPrevStory}
                              data-testid="button-prev-story"
                            >
                              <ChevronRight className="w-4 h-4 ml-1" />
                              القصة السابقة
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1" 
                              onClick={getNextStory}
                              data-testid="button-next-story"
                            >
                              القصة التالية
                              <ChevronLeft className="w-4 h-4 mr-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted/30 border-t">
                        <p className="text-xs text-muted-foreground text-center">
                          المحتوى مقتبس من Open Bible Stories (CC BY-SA 4.0)
                        </p>
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="videos">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ابحث عن فيديو..."
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    className="pr-10 pl-10 h-12 text-lg rounded-xl"
                    data-testid="input-video-search"
                  />
                  {videoSearch && (
                    <button
                      onClick={() => setVideoSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      data-testid="button-clear-search"
                    >
                      <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {videoSearch ? (
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">
                    نتائج البحث: {filteredVideos.length} فيديو
                  </span>
                </div>
              ) : null}

              {videoCategories.map((category) => {
                const categoryVideos = filteredVideos.filter(v => v.category === category);
                if (categoryVideos.length === 0) return null;
                const isHymns = category === "ترانيم للأطفال";

                return (
                  <div key={category} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Video className="w-5 h-5 text-purple-500" />
                      <h2 className="font-display text-xl font-bold text-foreground flex-1">{category}</h2>
                      {isHymns && !videoSearch && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                          onClick={startPlaylist}
                          data-testid="button-start-hymns-playlist"
                        >
                          <ListMusic className="w-4 h-4" />
                          <span className="text-xs">تشغيل الكل</span>
                        </Button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {categoryVideos.map((video, index) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                            onClick={() => openVideo(video, isHymns)}
                            data-testid={`video-card-${video.id}`}
                          >
                            <div className="relative h-40 overflow-hidden">
                              <img
                                src={getYouTubeThumbnail(video.youtubeId)}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                  <Play className="w-8 h-8 text-purple-600 mr-[-4px]" />
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-display text-lg font-bold text-foreground line-clamp-2">
                                {video.title}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {video.keywords.slice(0, 3).map((kw) => (
                                  <Badge key={kw} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredVideos.length === 0 && (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">لا توجد فيديوهات مطابقة للبحث</p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && closeVideo()}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden" data-testid="dialog-video">
            <DialogHeader className="p-4 pb-0">
              <div className="flex items-center justify-between gap-2">
                {playlistActive && (
                  <span className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                    {playlistIndex + 1} / {kidsHymnsPlaylist.length}
                  </span>
                )}
                <DialogTitle className="text-right font-display text-xl flex-1" data-testid="text-video-title">
                  {selectedVideo?.title}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="w-full">
              {selectedVideo && (
                <YouTubeCard
                  key={selectedVideo.youtubeId}
                  videoId={selectedVideo.youtubeId}
                  title={selectedVideo.title}
                />
              )}
            </div>
            <div className="p-4 pt-2">
              {playlistActive && (
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goNextPlaylist}
                    disabled={playlistIndex >= kidsHymnsPlaylist.length - 1}
                    className="gap-1"
                    data-testid="button-playlist-next"
                  >
                    <SkipBack className="w-4 h-4" />
                    التالي
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    <ListMusic className="w-3 h-3 inline ml-1" />
                    قائمة التشغيل
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goPrevPlaylist}
                    disabled={playlistIndex <= 0}
                    className="gap-1"
                    data-testid="button-playlist-prev"
                  >
                    السابق
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedVideo?.keywords.map((kw) => (
                  <Badge key={kw} variant="outline">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </motion.div>
      </div>
    </>
  );
}
