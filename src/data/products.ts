// ---------------------------------------------------------------------------
// Product data model + one fully-populated mock (Aura AI).
// This is the single source of truth the whole review page reads from. When it
// moves to a database later, the same shape can be returned from a query.
// ---------------------------------------------------------------------------

export interface Author {
  name: string;
  role: string;
  avatar: string;
  verified?: boolean;
}

export interface GalleryImage {
  full: string;
  thumb: string;
  alt: string;
}

/** A labeled data point, optionally with a Material Symbols icon name. */
export interface DataRow {
  label: string;
  value: string;
  icon?: string;
}

export interface Subscore {
  name: string;
  score: number;
  /** weight within the category, as a percentage (sums to 100 per category) */
  weight: number;
  description: string;
  /** factors that determine this subscore (shown as chips + a value table) */
  contributors: DataRow[];
}

export interface ProofItem {
  src: string;
  caption: string;
  sub?: string;
}

export interface RatingCategory {
  key: string;
  name: string;
  score: number;
  /** weight within the overall score, as a percentage (sums to 100) */
  weight: number;
  description: string;
  subscores: Subscore[];
  /** the category-level evidence table (right column) */
  evidence: DataRow[];
  /** proof media (right column) */
  proof: ProofItem[];
  /** plain-language summary shown in the "What this means" callout */
  whatThisMeans: string;
}

export interface SafetyItem {
  label: string;
  status: string;
  icon: string;
}

export interface FeatureSpec {
  name: string;
  value: string;
  icon: string;
  available: boolean;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  reviewedDate: string;
  modifiedDate: string;
  methodology: string;
  authors: Author[];
  websiteUrl: string;
  affiliateUrl: string;
  gallery: GalleryImage[];
  overallScore: number;
  overallSummary: string;
  ourTake: string;
  safetyAudit: SafetyItem[];
  featureSpecs: FeatureSpec[];
  categories: RatingCategory[];
}

// --- helpers to keep the mock terse -----------------------------------------
const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const avatar = (id: number) => `https://i.pravatar.cc/80?img=${id}`;

const auraAi: Product = {
  slug: 'aura-ai',
  name: 'Aura AI',
  tagline: 'A premium AI companion with lifelike chat, voice calls, and best-in-class video.',
  reviewedDate: 'Oct 24, 2024',
  modifiedDate: 'Oct 25, 2024',
  methodology: 'Methodology v3.0',
  authors: [
    { name: 'Herman Carter', role: 'AI Girlfriend Expert', avatar: avatar(12), verified: true },
    { name: 'Sarah Jenkins', role: 'Fact-Checker', avatar: avatar(45), verified: true },
  ],
  websiteUrl: 'https://example.com/aura-ai',
  affiliateUrl: 'https://example.com/go/aura-ai',
  gallery: [
    { full: img('aura-hero', 1280, 720), thumb: img('aura-hero', 320, 200), alt: 'Aura AI interface' },
    { full: img('aura-2', 1280, 720), thumb: img('aura-2', 320, 200), alt: 'Aura AI character gallery' },
    { full: img('aura-3', 1280, 720), thumb: img('aura-3', 320, 200), alt: 'Aura AI chat screen' },
    { full: img('aura-4', 1280, 720), thumb: img('aura-4', 320, 200), alt: 'Aura AI voice call' },
    { full: img('aura-5', 1280, 720), thumb: img('aura-5', 320, 200), alt: 'Aura AI customization' },
  ],
  overallScore: 9.2,
  overallSummary: 'Top-rated AI companion for realistic chat and immersive media.',
  ourTake:
    'Aura AI excels in character variety and chat realism, making it a top-tier choice for users seeking deep engagement. While the conversational depth is industry-leading, image generation speeds could be improved to match the otherwise seamless experience. Overall, it remains a premier destination for high-quality AI companionship.',
  safetyAudit: [
    { label: 'Zero-Retention Training', status: 'Verified', icon: 'shield_lock' },
    { label: 'Private Chat Monitoring', status: 'None', icon: 'visibility_off' },
    { label: 'Secure Encryption', status: 'Verified', icon: 'enhanced_encryption' },
    { label: 'No Third-Party Sharing', status: 'Verified', icon: 'share_off' },
    { label: 'Discreet Billing', status: 'Yes', icon: 'credit_card_off' },
  ],
  featureSpecs: [
    { name: 'Image to Video', value: 'Yes', icon: 'movie', available: true },
    { name: 'Text to Video', value: 'No', icon: 'text_fields', available: false },
    { name: 'External Image Generator', value: 'Yes', icon: 'image', available: true },
    { name: 'AI Phone Calls', value: 'Yes', icon: 'call', available: true },
    { name: 'Role Play Mode', value: 'Yes', icon: 'theater_comedy', available: true },
    { name: 'Voice Messages', value: 'Yes', icon: 'graphic_eq', available: true },
  ],
  categories: [
    {
      key: 'characters',
      name: 'Characters',
      score: 9.2,
      weight: 10,
      description: 'The range, discoverability, and quality of available AI characters.',
      subscores: [
        {
          name: 'Variety',
          score: 9.4,
          weight: 40,
          description: 'How many characters and styles.',
          contributors: [
            { icon: 'groups', label: 'Amount', value: '1,000+' },
            { icon: 'transgender', label: 'Genders', value: 'All' },
            { icon: 'public', label: 'Ethnicities', value: 'Diverse' },
          ],
        },
        {
          name: 'Discovery',
          score: 8.8,
          weight: 25,
          description: 'How easy it is to find characters for your specific needs.',
          contributors: [
            { icon: 'filter_alt', label: 'Filters', value: 'Customizable' },
            { icon: 'search', label: 'Search', value: 'Advanced' },
            { icon: 'category', label: 'Categories', value: 'Extensive' },
          ],
        },
        {
          name: 'Quality',
          score: 9.5,
          weight: 35,
          description: 'Overall visual and content quality.',
          contributors: [
            { icon: 'palette', label: 'Styles', value: 'Anime, Realistic, 3D' },
            { icon: 'hd', label: 'Fidelity', value: 'High' },
            { icon: 'auto_awesome', label: 'Detail', value: 'Rich' },
          ],
        },
      ],
      evidence: [
        { icon: 'groups', label: 'Amount', value: '1,000+' },
        { icon: 'palette', label: 'Styles', value: 'Anime, Realistic, 3D' },
        { icon: 'transgender', label: 'Genders', value: 'All' },
        { icon: 'public', label: 'Ethnicities', value: 'Diverse' },
        { icon: 'mood', label: 'Personalities', value: 'Dynamic' },
        { icon: 'auto_awesome', label: 'Scenarios', value: 'Unlimited' },
        { icon: 'filter_alt', label: 'Filters', value: 'Customizable' },
      ],
      proof: [
        { src: img('char-1', 300, 400), caption: 'Character Library', sub: '(1,000+ characters)' },
        { src: img('char-2', 300, 400), caption: 'Styles Preview', sub: '(Anime, Realistic, 3D)' },
        { src: img('char-3', 300, 400), caption: 'Filter & Discovery', sub: '(Customizable)' },
      ],
      whatThisMeans:
        'This platform offers an excellent range of characters with high quality and solid discoverability.',
    },
    {
      key: 'customization',
      name: 'Customization',
      score: 8.9,
      weight: 15,
      description: 'How much control you have over looks, personality, and voice.',
      subscores: [
        {
          name: 'Appearance',
          score: 9.1,
          weight: 40,
          description: 'Body, face, and outfit control.',
          contributors: [
            { icon: 'face', label: 'Presets', value: '50+' },
            { icon: 'checkroom', label: 'Outfits', value: 'Extensive' },
            { icon: 'tune', label: 'Fine Control', value: 'Yes' },
          ],
        },
        {
          name: 'Personality',
          score: 8.9,
          weight: 35,
          description: 'Traits, tone, and backstory.',
          contributors: [
            { icon: 'psychology', label: 'Traits', value: 'Custom' },
            { icon: 'history_edu', label: 'Backstory', value: 'Editable' },
            { icon: 'sentiment_satisfied', label: 'Tone', value: 'Adjustable' },
          ],
        },
        {
          name: 'Voice',
          score: 8.5,
          weight: 25,
          description: 'Voice selection and realism.',
          contributors: [
            { icon: 'record_voice_over', label: 'Voices', value: '12' },
            { icon: 'graphic_eq', label: 'Realism', value: 'High' },
            { icon: 'speed', label: 'Latency', value: 'Low' },
          ],
        },
      ],
      evidence: [
        { icon: 'face', label: 'Appearance Presets', value: '50+' },
        { icon: 'tune', label: 'Custom Traits', value: 'Yes' },
        { icon: 'record_voice_over', label: 'Voice Options', value: '12' },
        { icon: 'checkroom', label: 'Outfit Library', value: 'Extensive' },
        { icon: 'memory', label: 'Memory', value: 'Long-term' },
      ],
      proof: [
        { src: img('cust-1', 300, 400), caption: 'Appearance Editor', sub: '(50+ presets)' },
        { src: img('cust-2', 300, 400), caption: 'Personality Builder', sub: '(Custom traits)' },
        { src: img('cust-3', 300, 400), caption: 'Voice Picker', sub: '(12 voices)' },
      ],
      whatThisMeans: 'Deep, flexible customization across looks, personality, and voice.',
    },
    {
      key: 'chat',
      name: 'Chat',
      score: 9.1,
      weight: 20,
      description: 'The realism, memory, and responsiveness of conversations.',
      subscores: [
        {
          name: 'Realism',
          score: 9.3,
          weight: 40,
          description: 'How human the conversation feels.',
          contributors: [
            { icon: 'smart_toy', label: 'Model', value: 'Proprietary LLM' },
            { icon: 'forum', label: 'Coherence', value: 'High' },
            { icon: 'translate', label: 'Languages', value: '30+' },
          ],
        },
        {
          name: 'Memory',
          score: 9.0,
          weight: 35,
          description: 'Recall of past conversations.',
          contributors: [
            { icon: 'memory', label: 'Context', value: 'Long-term' },
            { icon: 'bookmark', label: 'Key Facts', value: 'Retained' },
            { icon: 'update', label: 'Persistence', value: 'Cross-session' },
          ],
        },
        {
          name: 'Responsiveness',
          score: 8.8,
          weight: 25,
          description: 'Speed and coherence of replies.',
          contributors: [
            { icon: 'speed', label: 'Avg Response', value: '< 2s' },
            { icon: 'bolt', label: 'Streaming', value: 'Yes' },
            { icon: 'sync', label: 'Stability', value: 'High' },
          ],
        },
      ],
      evidence: [
        { icon: 'smart_toy', label: 'Model', value: 'Proprietary LLM' },
        { icon: 'memory', label: 'Context Memory', value: 'Long-term' },
        { icon: 'speed', label: 'Avg Response', value: '< 2s' },
        { icon: 'translate', label: 'Languages', value: '30+' },
        { icon: 'groups', label: 'Group Chat', value: 'No' },
      ],
      proof: [
        { src: img('chat-1', 300, 400), caption: 'Conversation', sub: '(Realistic tone)' },
        { src: img('chat-2', 300, 400), caption: 'Memory Recall', sub: '(Cross-session)' },
        { src: img('chat-3', 300, 400), caption: 'Fast Replies', sub: '(< 2s)' },
      ],
      whatThisMeans: 'Industry-leading conversational realism with strong long-term memory.',
    },
    {
      key: 'chat-features',
      name: 'Chat Features',
      score: 9.5,
      weight: 10,
      description: 'Interactive extras beyond text: calls, roleplay, and media.',
      subscores: [
        {
          name: 'Voice Calls',
          score: 9.6,
          weight: 35,
          description: 'Real-time AI phone calls.',
          contributors: [
            { icon: 'call', label: 'Live Calls', value: 'Yes' },
            { icon: 'graphic_eq', label: 'Voice Quality', value: 'High' },
            { icon: 'schedule', label: 'Call Length', value: 'Unlimited' },
          ],
        },
        {
          name: 'Roleplay',
          score: 9.5,
          weight: 35,
          description: 'Scenario and roleplay modes.',
          contributors: [
            { icon: 'theater_comedy', label: 'Modes', value: 'Unlimited' },
            { icon: 'auto_stories', label: 'Scenarios', value: 'Rich' },
            { icon: 'edit', label: 'Custom Scripts', value: 'Yes' },
          ],
        },
        {
          name: 'Media Sharing',
          score: 9.3,
          weight: 30,
          description: 'Sending photos and voice notes.',
          contributors: [
            { icon: 'image', label: 'Photo Requests', value: 'Yes' },
            { icon: 'mic', label: 'Voice Notes', value: 'Yes' },
            { icon: 'attach_file', label: 'Attachments', value: 'Yes' },
          ],
        },
      ],
      evidence: [
        { icon: 'call', label: 'Voice Calls', value: 'Yes' },
        { icon: 'theater_comedy', label: 'Roleplay Modes', value: 'Unlimited' },
        { icon: 'image', label: 'Photo Requests', value: 'Yes' },
        { icon: 'mic', label: 'Voice Notes', value: 'Yes' },
        { icon: 'auto_awesome', label: 'Interactive Scenarios', value: 'Yes' },
      ],
      proof: [
        { src: img('feat-1', 300, 400), caption: 'AI Phone Call', sub: '(Real-time)' },
        { src: img('feat-2', 300, 400), caption: 'Roleplay Mode', sub: '(Unlimited)' },
        { src: img('feat-3', 300, 400), caption: 'Media Sharing', sub: '(Photos & voice)' },
      ],
      whatThisMeans: 'A rich, interactive feature set that goes well beyond text.',
    },
    {
      key: 'images',
      name: 'Images',
      score: 7.5,
      weight: 15,
      description: 'Image generation quality, speed, and character consistency.',
      subscores: [
        {
          name: 'Quality',
          score: 8.0,
          weight: 40,
          description: 'Fidelity and detail of generated images.',
          contributors: [
            { icon: 'hd', label: 'Resolution', value: '1024px' },
            { icon: 'auto_awesome', label: 'Detail', value: 'Good' },
            { icon: 'palette', label: 'Styles', value: 'Multiple' },
          ],
        },
        {
          name: 'Speed',
          score: 6.8,
          weight: 30,
          description: 'Generation time per image.',
          contributors: [
            { icon: 'timer', label: 'Avg Gen Time', value: '~15s' },
            { icon: 'bolt', label: 'Priority Queue', value: 'Paid' },
            { icon: 'stacks', label: 'Batch', value: 'Limited' },
          ],
        },
        {
          name: 'Consistency',
          score: 7.6,
          weight: 30,
          description: 'Character consistency across images.',
          contributors: [
            { icon: 'lock', label: 'Character Lock', value: 'Partial' },
            { icon: 'face', label: 'Face Match', value: 'Good' },
            { icon: 'checkroom', label: 'Outfit Match', value: 'Fair' },
          ],
        },
      ],
      evidence: [
        { icon: 'hd', label: 'Resolution', value: '1024px' },
        { icon: 'timer', label: 'Avg Gen Time', value: '~15s' },
        { icon: 'lock', label: 'Character Lock', value: 'Partial' },
        { icon: 'explicit', label: 'NSFW', value: 'Yes' },
        { icon: 'production_quantity_limits', label: 'Daily Limit', value: 'Tiered' },
      ],
      proof: [
        { src: img('img-1', 300, 400), caption: 'Portrait', sub: '(1024px)' },
        { src: img('img-2', 300, 400), caption: 'Style Range', sub: '(Multiple)' },
        { src: img('img-3', 300, 400), caption: 'Consistency', sub: '(Partial lock)' },
      ],
      whatThisMeans: 'Solid image quality held back by slower generation speeds.',
    },
    {
      key: 'video',
      name: 'Video',
      score: 9.8,
      weight: 10,
      description: 'Video generation quality and image-to-video animation.',
      subscores: [
        {
          name: 'Quality',
          score: 9.9,
          weight: 40,
          description: 'Video fidelity and smoothness.',
          contributors: [
            { icon: 'hd', label: 'Resolution', value: '720p' },
            { icon: 'auto_awesome', label: 'Fidelity', value: 'Excellent' },
            { icon: 'blur_on', label: 'Artifacts', value: 'Minimal' },
          ],
        },
        {
          name: 'Image to Video',
          score: 9.8,
          weight: 35,
          description: 'Animating existing images.',
          contributors: [
            { icon: 'movie', label: 'Supported', value: 'Yes' },
            { icon: 'animation', label: 'Motion', value: 'Natural' },
            { icon: 'tune', label: 'Control', value: 'Good' },
          ],
        },
        {
          name: 'Length',
          score: 9.6,
          weight: 25,
          description: 'Max clip duration and smoothness.',
          contributors: [
            { icon: 'schedule', label: 'Max Length', value: '8s' },
            { icon: 'loop', label: 'Looping', value: 'Yes' },
            { icon: 'water_drop', label: 'Watermark', value: 'No' },
          ],
        },
      ],
      evidence: [
        { icon: 'movie', label: 'Image to Video', value: 'Yes' },
        { icon: 'text_fields', label: 'Text to Video', value: 'No' },
        { icon: 'schedule', label: 'Max Length', value: '8s' },
        { icon: 'hd', label: 'Resolution', value: '720p' },
        { icon: 'water_drop', label: 'Watermark', value: 'No' },
      ],
      proof: [
        { src: img('vid-1', 300, 400), caption: 'Image to Video', sub: '(Natural motion)' },
        { src: img('vid-2', 300, 400), caption: 'Clip Quality', sub: '(720p)' },
        { src: img('vid-3', 300, 400), caption: 'No Watermark', sub: '(Clean output)' },
      ],
      whatThisMeans: 'Best-in-class video generation and image-to-video animation.',
    },
    {
      key: 'privacy',
      name: 'Privacy',
      score: 9.2,
      weight: 10,
      description: 'Data handling, encryption, and billing discretion.',
      subscores: [
        {
          name: 'Data Handling',
          score: 9.4,
          weight: 40,
          description: 'Retention and training policy.',
          contributors: [
            { icon: 'shield_lock', label: 'Zero-Retention', value: 'Yes' },
            { icon: 'model_training', label: 'Trains on Chats', value: 'No' },
            { icon: 'download', label: 'Data Export', value: 'Yes' },
          ],
        },
        {
          name: 'Encryption',
          score: 9.2,
          weight: 35,
          description: 'Data in transit and at rest.',
          contributors: [
            { icon: 'enhanced_encryption', label: 'Standard', value: 'AES-256' },
            { icon: 'lock', label: 'In Transit', value: 'TLS 1.3' },
            { icon: 'vpn_key', label: 'At Rest', value: 'Encrypted' },
          ],
        },
        {
          name: 'Billing Discretion',
          score: 8.9,
          weight: 25,
          description: 'Discreet charges and account privacy.',
          contributors: [
            { icon: 'credit_card_off', label: 'Discreet Billing', value: 'Yes' },
            { icon: 'badge', label: 'Descriptor', value: 'Neutral' },
            { icon: 'no_accounts', label: 'Anonymous Signup', value: 'Yes' },
          ],
        },
      ],
      evidence: [
        { icon: 'shield_lock', label: 'Zero-Retention', value: 'Yes' },
        { icon: 'enhanced_encryption', label: 'Encryption', value: 'AES-256' },
        { icon: 'credit_card_off', label: 'Discreet Billing', value: 'Yes' },
        { icon: 'download', label: 'Data Export', value: 'Yes' },
        { icon: 'share_off', label: 'Third-Party Sharing', value: 'None' },
      ],
      proof: [
        { src: img('priv-1', 300, 400), caption: 'Privacy Policy', sub: '(Zero-retention)' },
        { src: img('priv-2', 300, 400), caption: 'Encryption', sub: '(AES-256)' },
        { src: img('priv-3', 300, 400), caption: 'Billing', sub: '(Discreet)' },
      ],
      whatThisMeans: 'Strong, privacy-first data practices with discreet billing.',
    },
    {
      key: 'pricing',
      name: 'Pricing',
      score: 8.8,
      weight: 10,
      description: 'Value for money, free tier, and plan flexibility.',
      subscores: [
        {
          name: 'Value',
          score: 9.0,
          weight: 40,
          description: 'Features per dollar.',
          contributors: [
            { icon: 'payments', label: 'Starting Price', value: '$9.99/mo' },
            { icon: 'inventory', label: 'Feature Set', value: 'Extensive' },
            { icon: 'savings', label: 'Annual Discount', value: '40%' },
          ],
        },
        {
          name: 'Free Tier',
          score: 8.6,
          weight: 30,
          description: 'Usefulness of the free plan.',
          contributors: [
            { icon: 'card_giftcard', label: 'Free Tier', value: 'Yes' },
            { icon: 'chat', label: 'Free Messages', value: 'Daily' },
            { icon: 'lock_open', label: 'Core Access', value: 'Partial' },
          ],
        },
        {
          name: 'Flexibility',
          score: 8.7,
          weight: 30,
          description: 'Plan options and cancellation.',
          contributors: [
            { icon: 'tune', label: 'Plans', value: 'Multiple' },
            { icon: 'event_repeat', label: 'Billing Cycles', value: 'Monthly/Annual' },
            { icon: 'cancel', label: 'Cancel Anytime', value: 'Yes' },
          ],
        },
      ],
      evidence: [
        { icon: 'card_giftcard', label: 'Free Tier', value: 'Yes' },
        { icon: 'payments', label: 'Starting Price', value: '$9.99/mo' },
        { icon: 'savings', label: 'Annual Discount', value: '40%' },
        { icon: 'currency_exchange', label: 'Refund Policy', value: '7 days' },
        { icon: 'money_off', label: 'Hidden Fees', value: 'None' },
      ],
      proof: [
        { src: img('price-1', 300, 400), caption: 'Plans', sub: '(From $9.99/mo)' },
        { src: img('price-2', 300, 400), caption: 'Free Tier', sub: '(Daily messages)' },
        { src: img('price-3', 300, 400), caption: 'Annual Savings', sub: '(40% off)' },
      ],
      whatThisMeans: 'Competitive pricing with a genuinely useful free tier.',
    },
  ],
};

export const products: Product[] = [auraAi];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
