import React, { useState, useRef } from 'react';
import { Camera, Heart, PlusCircle, ShieldAlert, Sparkles, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auditContentWithGemini } from '../lib/safetyAudit';

export const MediaFeedTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { communityPosts, addCommunityPost, toggleLikePost, banCurrentUser, user } = useAuth();

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !imagePreview) return;

    setIsPublishing(true);
    setSafetyError(null);

    try {
      // 1. Global Content Moderation Guard (AI Safety Wrapper)
      const auditResult = await auditContentWithGemini(imagePreview, caption, language);

      if (!auditResult.isSafe) {
        setIsPublishing(false);
        setIsPostModalOpen(false);
        await banCurrentUser(
          auditResult.reason ||
            (language === 'ar'
              ? 'تم اكتشاف محتوى مخالف لقواعد الأمان والآداب العامة في المنشور.'
              : 'Content flagged as unsafe/inappropriate. Account has been automatically banned.')
        );
        return;
      }

      // Safe! Add to Community Feed
      addCommunityPost(
        caption.trim(),
        imagePreview || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
        'image'
      );

      setCaption('');
      setImagePreview(null);
      setIsPostModalOpen(false);
    } catch (err: any) {
      console.warn('Safety shield check warning:', err);
      setIsPublishing(false);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto">
      {/* Tab Banner */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-black text-[#FFD43F] tracking-wide flex items-center gap-1.5 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Camera className="w-5 h-5 text-[#2BD97F]" />
            <span>{t('feedTitle')}</span>
          </h2>
          <p className="text-xs text-[#A7F3D0] font-bold">
            {t('feedSubtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            setIsPostModalOpen(true);
            setSafetyError(null);
          }}
          className="retro-btn bg-[#2BD97F] text-black font-black text-xs py-2 px-3 rounded-xl flex items-center gap-1 hover:bg-[#25c472]"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{t('postActionBtn')}</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {communityPosts.map((post) => (
          <div
            key={post.id}
            className="retro-card bg-[#103D29] overflow-hidden"
          >
            {/* Post Author */}
            <div className="p-3 bg-[#0c2f1f] border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={post.author_avatar}
                  alt={post.author_name}
                  className="w-9 h-9 rounded-xl border-2 border-black bg-black object-cover"
                />
                <div>
                  <h4 className="font-extrabold text-xs text-white leading-tight">
                    {post.author_name}
                  </h4>
                  <span className="text-[10px] text-neutral-400 font-bold">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-black text-[#2BD97F] bg-black/60 px-2 py-0.5 rounded-md border border-neutral-700">
                <Sparkles className="w-3 h-3 text-[#FFD43F]" />
                <span>Verified</span>
              </div>
            </div>

            {/* Media Image */}
            <div className="relative bg-black border-b-2 border-black max-h-72 overflow-hidden flex items-center justify-center">
              <img
                src={post.media_url}
                alt="Eco Action"
                className="w-full object-cover max-h-72"
              />
            </div>

            {/* Caption & Cheer Action */}
            <div className="p-3">
              <p className="text-xs text-white font-medium leading-relaxed mb-3">
                {post.caption}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-black/40">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`retro-btn px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors ${
                    post.is_liked
                      ? 'bg-[#FF5A5F] text-white'
                      : 'bg-black text-[#FF5A5F] hover:bg-neutral-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-white' : ''}`} />
                  <span>{post.likes_count} {t('likeBtn')}</span>
                </button>

                <span className="text-[10px] text-neutral-400 font-bold">
                  AI Shield Protected
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Action Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-md rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#2BD97F] border-b-4 border-black px-4 py-3 flex items-center justify-between text-black">
              <div className="flex items-center gap-2 font-black text-sm">
                <Camera className="w-5 h-5 stroke-[2.5]" />
                <span>{t('postModalTitle')}</span>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center retro-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="p-4 space-y-3">
              {/* Photo selector */}
              <div>
                <label className="block text-xs font-black text-white mb-1">
                  {language === 'ar' ? 'صورة العمل البيئي:' : 'Action Photo Proof:'}
                </label>
                {imagePreview ? (
                  <div className="relative border-2 border-black rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="max-h-48 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-lg retro-btn hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#FFB443] bg-[#062316] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#0a2f1e]"
                  >
                    <Camera className="w-6 h-6 text-[#FFB443] mb-1" />
                    <span className="text-xs font-extrabold text-white">{t('takeOrUploadPhoto')}</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-black text-white mb-1">
                  {language === 'ar' ? 'الوصف البيئي:' : 'Caption & Impact:'}
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t('postCaptionPlaceholder')}
                  className="w-full bg-[#062316] border-2 border-black rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden focus:border-[#FFB443]"
                />
              </div>

              {/* Safety Shield Warning Box */}
              <div className="bg-[#062316] border border-[#FFD43F] rounded-xl p-2.5 flex items-start gap-2 text-xs text-[#FFD43F]">
                <ShieldAlert className="w-4 h-4 text-[#FFB443] shrink-0 mt-0.5" />
                <span className="leading-tight text-[11px] font-bold">
                  {t('safetyShieldNotice')}
                </span>
              </div>

              {safetyError && (
                <div className="bg-[#3b1214] border-2 border-[#FF5A5F] rounded-xl p-3 text-xs text-[#FF5A5F] font-black flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{safetyError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPublishing || (!caption.trim() && !imagePreview)}
                className="w-full retro-btn bg-[#FFB443] disabled:opacity-40 text-black font-black py-2.5 rounded-xl text-xs hover:bg-yellow-400 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{t('moderatingPost')}</span>
                  </>
                ) : (
                  <span>{t('publishPostBtn')}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
