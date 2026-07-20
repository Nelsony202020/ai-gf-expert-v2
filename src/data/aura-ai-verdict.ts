import type { VerdictItem } from './products';

export const auraAiVerdicts: VerdictItem[] = [
  {
    id: 'overall',
    label: 'Overall Performance',
    tagline: 'Top-tier companion platform',
    summary:
      'Aura AI is a top-tier platform for deep AI companionship, excelling in character depth, chat realism, and video generation. While its image workflow is slower than some rivals, it remains an excellent choice for users who prioritize conversation quality and customization. Occasional latency during peak hours and credit costs for heavy media use are the main drawbacks.',
    pros: [
      'Fantastic character variety with 2,450+ presets across multiple styles.',
      'Highly realistic chat with strong memory and roleplay performance.',
      'Deep customization across appearance, personality, and voice.',
      'Industry-leading privacy practices and discreet billing.',
      'Best-in-class image-to-video generation for companion platforms.',
    ],
    cons: [
      'Image generation is slower than competitors (~15s median).',
      'Occasional generation failures during peak server load.',
      'Limited free tier with meaningful costs for regular video use.',
      'No text-to-video; video clips capped at 5 seconds.',
    ],
  },
  {
    id: 'characters',
    label: 'Characters',
    tagline: 'Excellent library depth',
    summary:
      'Aura AI offers one of the largest ready-made character libraries we tested, with strong discovery tools and high profile quality on our 50-character sample. Duplicates exist but remain low at 4%.',
    pros: [
      '2,450+ characters across realistic, anime, and fantasy styles.',
      '12 useful filters and reliable search.',
      '90% success on our 10-task browsing benchmark.',
      'Strong profile completeness and visual quality scores.',
    ],
    cons: [
      'A few near-duplicate characters in large library sections.',
      'Popular characters can overshadow newer additions.',
    ],
  },
  {
    id: 'customization',
    label: 'Customization',
    tagline: 'Deep character builder',
    summary:
      'Creating your own companion is a standout strength. Appearance, personality, and post-creation editing all score well, with custom prompts accepted on every test character.',
    pros: [
      '60+ face options and 120+ clothing items.',
      '48 personality traits and 14 voice options.',
      'Full editing after creation across all major areas.',
      'Custom text prompts work on all five test creations.',
    ],
    cons: [
      'Some body controls less granular than dedicated avatar tools.',
      'Preview before creation could show more detail.',
    ],
  },
  {
    id: 'chat',
    label: 'Chat',
    tagline: 'Industry-leading conversations',
    summary:
      'Chat quality is Aura AI\'s core strength. Memory, roleplay, and naturalness all tested among the best in the category, with fast median reply times at 1.8 seconds.',
    pros: [
      '88% memory retention across our 50-fact test.',
      '9.4 / 10 roleplay quality in standardized scenarios.',
      'Low repetition and unnecessary refusals.',
      'Strong emotional response and style consistency.',
    ],
    cons: [
      'Rare contradictory responses in very long sessions.',
      'Initiative could be stronger in passive conversation modes.',
    ],
  },
  {
    id: 'chat-features',
    label: 'Chat Features',
    tagline: 'Rich in-chat toolkit',
    summary:
      'The chat experience goes well beyond text — voice calls, proactive messages, and six chat modes make it one of the most feature-complete platforms we reviewed.',
    pros: [
      'Live voice calls connect reliably in all three tests.',
      'Images, voice messages, and in-chat video supported.',
      'Manual memory save/edit and message regeneration.',
      'Proactive messaging during our 7-day observation.',
    ],
    cons: [
      'No multi-character group chat.',
      'GIF support is limited compared to mainstream messengers.',
      'Chat export only partially supported.',
    ],
  },
  {
    id: 'images',
    label: 'Images',
    tagline: 'Solid but not class-leading',
    summary:
      'Image quality is good and character consistency is acceptable, but generation speed and occasional visual errors hold this category back compared to dedicated image platforms.',
    pros: [
      'Separate generator and in-chat generation both available.',
      'Custom prompting with NSFW support where allowed.',
      '76% character consistency across test set.',
      '1024×1024 maximum resolution.',
    ],
    cons: [
      '~15 second median generation time.',
      '14% of images show anatomy or visual errors.',
      'Limited image editing compared to specialist tools.',
    ],
  },
  {
    id: 'video',
    label: 'Video',
    tagline: 'Strong image-to-video',
    summary:
      'Aura AI\'s video output quality is impressive for short clips, with natural motion and high character consistency. Capability is limited to image-to-video only.',
    pros: [
      '94% motion quality score in our test batch.',
      '95% character consistency across clips.',
      'Available inside chat and standalone generator.',
      'Only 6% of clips show major visual errors.',
    ],
    cons: [
      'No text-to-video support.',
      'Maximum 5-second clip length.',
      '$1.40 per generation adds up quickly.',
      'No generated audio on video output.',
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy',
    tagline: 'Privacy-first platform',
    summary:
      'Aura AI clearly states it does not train on chats, offers strong user controls, and supports discreet billing — a combination that ranks among the best in the category.',
    pros: [
      'No training on user chats (verified in policy).',
      'Delete chats, account, and export data all supported.',
      'Two-factor authentication available.',
      'Discreet billing descriptor shown before payment.',
    ],
    cons: [
      'Limited third-party data sharing categories still disclosed.',
      'End-to-end encryption not explicitly confirmed.',
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    tagline: 'Fair value — watch the credits',
    summary:
      'The $12.99 subscription is competitive, but regular users should expect ~$31/month once images and video are factored in. Heavy users may reach ~$89/month.',
    pros: [
      'Annual plan effective at $9.99/month.',
      '500 credits included monthly.',
      '8 of 10 core features included at regular-use cost.',
      '7-day refund window available.',
    ],
    cons: [
      'Video at $1.40 each drives up real monthly cost.',
      'Free plan limited to 100 messages/day.',
      'Two features sit behind additional paywalls.',
    ],
  },
];

export const auraAiExpertOpinion =
  'After hundreds of hours testing AI companion platforms, Aura AI stands out for how consistently it delivers on the fundamentals. Conversation feels present rather than scripted, characters are worth returning to, and the privacy policies actually respect the user — a combination that is rarer than marketing pages suggest. I recommend it to anyone who prioritizes chat depth and long-term companionship over raw image speed. The character library is deep enough that most users will find several presets they connect with before ever touching the builder, and customization holds up when you do want something personal. Where Aura loses ground is media workflow: image generation is slower than dedicated rivals, and video costs add up if you generate clips daily. None of that undermines the core chat experience, but you should budget for credits if images and video are part of your routine. For privacy-conscious users, the no-training-on-chats policy and discreet billing put it ahead of most competitors. Overall, this is one of the few platforms I would happily use myself — not just review.';
