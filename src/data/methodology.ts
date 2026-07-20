import { toSlug } from '../lib/slugs';

export interface MethodologyEntry {
  category: string;
  subscore: string;
  contributor: string;
  /** What is being measured */
  measured: string;
  /** How the test is completed */
  howToTest: string;
  /** Standard test size (messages, images, etc.) */
  testSize?: string;
  /** What result is displayed on the review page */
  resultFormat: string;
  /** What counts as good or bad */
  goodBad?: string;
  /** How the result converts into an internal 0–10 score */
  scoreConversion?: string;
}

const entries: MethodologyEntry[] = [];

function add(
  category: string,
  subscore: string,
  contributor: string,
  measured: string,
  howToTest: string,
  resultFormat: string,
  extra?: Partial<Pick<MethodologyEntry, 'testSize' | 'goodBad' | 'scoreConversion'>>,
) {
  entries.push({ category, subscore, contributor, measured, howToTest, resultFormat, ...extra });
}

// --- Characters ---
add('characters', 'Variety', 'Amount', 'Total number of available characters', 'Record the total shown by the platform. If no total is shown, count all visible listings. If not possible, report Unknown.', 'Number of characters', { testSize: '50-character sample for quality checks' });
add('characters', 'Variety', 'Styles', 'Distinct visual styles in the library', 'Count clearly different visual styles (realistic, anime, fantasy, etc.).', 'Number of styles and list of available styles');
add('characters', 'Variety', 'Genders', 'Gender categories offered', 'Count gender categories shown by the platform.', 'Number of gender categories and list');
add('characters', 'Variety', 'Ethnicities', 'Ethnicity categories represented', 'Count ethnicity categories shown. Do not guess ethnicity from appearance.', 'Number of ethnicity categories and list');
add('characters', 'Variety', 'Personalities', 'Distinct personality types', 'Count personality categories or filters. Do not count duplicate labels.', 'Number of personality types');
add('characters', 'Variety', 'Scenarios', 'Relationship and roleplay types', 'Count relationship, story and roleplay categories.', 'Number of scenarios and list of types');
add('characters', 'Discovery', 'Filters', 'Useful character filters', 'Count filters that help narrow the library. Do not count sort options.', 'Number of useful filters');
add('characters', 'Discovery', 'Categories', 'Useful browsing categories', 'Count categories leading to meaningfully different character groups.', 'Number of useful categories');
add('characters', 'Discovery', 'Search', 'Character search availability', 'Search for three character names and three keywords. Yes = all six work; Limited = partial; No = unavailable.', 'Yes, Limited or No', { testSize: '6 search queries' });
add('characters', 'Discovery', 'Browsing', 'Ease of finding suitable characters', 'Complete 10 fixed search tasks (realistic female/male, anime, fantasy, romantic, dominant, ethnicity, personality, new, popular). Record found, clicks, and time.', 'Percentage completed, average clicks and time', { testSize: '10 browsing tasks' });
add('characters', 'Quality', 'Duplicates', 'Duplicate or near-duplicate characters', 'Review 50 characters. Count duplicates with nearly the same image, name, description, personality and scenario.', 'Number and percentage in 50-character sample', { testSize: '50 characters' });
add('characters', 'Quality', 'Originality', 'Distinctness of characters', 'Review same 50 characters. One point each for distinct appearance, personality, scenario. Pass = 2+ points.', 'Percentage of characters that pass', { testSize: '50 characters' });
add('characters', 'Quality', 'Profile Quality', 'Completeness of character profiles', 'Check 50 profiles for name, description, personality, relationship/scenario, example dialogue. One point per item.', 'Average profile completeness percentage', { testSize: '50 characters' });
add('characters', 'Quality', 'Visual Quality', 'Quality of character images', 'Review main profile image of 50 characters. One point each for clear face, body, no anatomy errors, no damage, good presentation.', 'Average percentage of checks passed', { testSize: '50 characters' });

// --- Customization ---
add('customization', 'Appearance', 'Gender', 'Available gender options', 'Create a new character and count all selectable gender options.', 'Number of options and list');
add('customization', 'Appearance', 'Age', 'Available age options', 'Count selectable adult age options or record min/max allowed age.', 'Number of options or age range');
add('customization', 'Appearance', 'Ethnicity', 'Available ethnicity options', 'Count all selectable ethnicity options.', 'Number of options and list');
add('customization', 'Appearance', 'Face', 'Face customization options', 'Count face presets and separate controls (shape, eyes, nose, lips).', 'Number of presets and separate controls');
add('customization', 'Appearance', 'Hair', 'Hair colors and styles', 'Count available hairstyles and hair colors.', 'Number of styles and colors');
add('customization', 'Appearance', 'Body', 'Body types and proportions', 'Count body presets and controls (height, type, chest, waist, hips).', 'Number of presets and controls');
add('customization', 'Appearance', 'Clothing', 'Clothing options', 'Count clothing items and categories (casual, formal, lingerie, etc.).', 'Number of items and categories');
add('customization', 'Personality', 'Traits', 'Personality traits', 'Count selectable traits and max selectable per character.', 'Number of traits and max selectable');
add('customization', 'Personality', 'Interests', 'Interests and hobbies', 'Count interests and test custom interest entry.', 'Number of interests; custom entry Yes/No');
add('customization', 'Personality', 'Communication', 'Communication styles', 'Count styles (affectionate, sarcastic, shy, direct, formal, etc.).', 'Number of communication styles');
add('customization', 'Personality', 'Relationship', 'Relationship types', 'Count types (girlfriend, boyfriend, friend, spouse, dominant, etc.).', 'Number of relationship types');
add('customization', 'Personality', 'Role', 'Occupations and backgrounds', 'Count preset roles and test custom role entry.', 'Number of preset roles; custom role Yes/No');
add('customization', 'Personality', 'Voice', 'Voice options', 'Count voices and test three for noticeable differences.', 'Number of voices; previews available Yes/No', { testSize: '5 created characters' });
add('customization', 'Control', 'Custom Prompts', 'Custom text instructions', 'Create five characters with custom instructions. Yes/Limited/No based on acceptance.', 'Yes, Limited or No');
add('customization', 'Control', 'Editing', 'Post-creation editing', 'Create five characters; try editing appearance, personality, relationship, voice, name.', 'Number and percentage of editable areas');
add('customization', 'Control', 'Detail Level', 'Precision of character control', '20-item checklist (gender, age, ethnicity, face, eyes, nose, lips, hair, body, clothing, personality, interests, communication, relationship, voice, etc.).', 'Number and percentage of 20 controls supported');
add('customization', 'Control', 'Combinations', 'Presets plus custom instructions', 'Create five characters using presets and custom prompt. Pass when presets kept and instruction followed.', 'Successful creations out of five');
add('customization', 'Control', 'Preview', 'Preview before creation', 'Create five characters; check for visual or written preview before confirmation.', 'Yes, Limited or No');

// --- Chat ---
const chatTest = '10 conversations × 20 AI replies = 200 replies';
add('chat', 'Understanding', 'Memory', 'Facts remembered across conversation', 'Introduce five facts per conversation (name, job, food, trip, preference). Test after 10 replies. 50 memory tests total.', 'Percentage of 50 facts remembered', { testSize: chatTest, scoreConversion: 'Internal 0–10 score from pass rate' });
add('chat', 'Understanding', 'Relevance', 'Prompts answered correctly', 'Five direct questions per conversation; reply must answer without changing subject. 50 tests.', 'Percentage of relevant answers', { testSize: chatTest });
add('chat', 'Understanding', 'Context', 'Multi-message context tracking', 'One five-message story per conversation; character must use info from beginning, middle and end. 10 tests.', 'Percentage of context tests passed', { testSize: chatTest });
add('chat', 'Understanding', 'Instructions', 'Following specific requests', 'Three clear instructions per conversation (two sentences, one question, stay in role). 30 tests.', 'Percentage of instructions followed', { testSize: chatTest });
add('chat', 'Understanding', 'Roleplay Accuracy', 'Maintaining assigned scenario', 'One fixed roleplay per conversation. One point each for role, user role, setting, relationship, situation. 50 checks.', 'Percentage of 50 roleplay checks passed', { testSize: chatTest });
add('chat', 'Realism', 'Naturalness', 'Natural conversation feel', 'Review all 200 replies. Pass when natural wording, appropriate length, logical flow, no robotic language (3 of 4 checks).', 'Percentage of 200 replies that pass', { testSize: chatTest });
add('chat', 'Realism', 'Personality', 'Personality consistency', 'Three traits per character; conversation passes if 2+ traits kept across 20 replies. 10 conversations.', 'Percentage of conversations that pass', { testSize: chatTest });
add('chat', 'Realism', 'Roleplay', 'Roleplay quality', 'Review 10 roleplay conversations. Points for staying in character, useful details, responding to actions, consistency, moving forward.', 'Percentage of 50 roleplay checks passed', { testSize: chatTest });
add('chat', 'Realism', 'Initiative', 'Moving conversation forward', '10 open-ended messages per conversation = 100 chances. Pass when asks question, adds detail, or suggests next action.', 'Percentage showing useful initiative', { testSize: chatTest });
add('chat', 'Realism', 'Emotion', 'Appropriate emotional responses', 'Five emotional situations per conversation (happy, sad, angry, nervous, romantic). 50 tests.', 'Percentage of appropriate responses', { testSize: chatTest });
add('chat', 'Realism', 'Style', 'Communication style consistency', 'One style per conversation; each reply must match. 200 replies.', 'Percentage maintaining selected style', { testSize: chatTest });
add('chat', 'Reliability', 'Repetition', 'Repeated responses', 'Review 200 replies; count repeats of same sentence, idea or structure without reason.', 'Repeated replies per 200 and per 50 messages', { testSize: chatTest, resultFormat: 'e.g. 3 per 50 messages' });
add('chat', 'Reliability', 'Refusals', 'Unnecessary refusals', 'Send 50 allowed prompts that do not break platform rules. Count refusals without valid reason.', 'Unnecessary refusals per 50 prompts', { testSize: '50 allowed prompts' });
add('chat', 'Reliability', 'Speed', 'Median reply time', 'Time 50 replies from send to full reply visible.', 'Median reply time in seconds', { testSize: '50 replies', scoreConversion: 'Seconds displayed on review; converted to 0–10 via fixed speed bands' });
add('chat', 'Reliability', 'Errors', 'Broken or unrelated responses', 'Review 200 replies; count cut off, broken, nonsensical, empty or unrelated.', 'Errors per 200 and per 50 replies', { testSize: chatTest });
add('chat', 'Reliability', 'Consistency', 'Contradictory responses', 'Five fixed facts per conversation; check for later contradictions. 50 checks.', 'Number and percentage of contradictions', { testSize: chatTest });
add('chat', 'Reliability', 'Recovery', 'Recovering from misunderstanding', 'One deliberate misunderstanding per conversation; correct immediately. Pass if understood within next two replies.', 'Percentage of 10 recovery tests passed', { testSize: chatTest });

// --- Chat Features ---
add('chat-features', 'Media', 'Images Sent', 'Users sending images in chat', 'Send three different image files in three separate chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Media', 'Images Received', 'Characters sending images', 'Request one image in three separate chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Media', 'Voice Sent', 'Users sending voice messages', 'Send three voice messages in three chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Media', 'Voice Received', 'Characters sending voice messages', 'Request voice reply in three chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Media', 'Chat Video', 'Video in chat', 'Request one video in three separate chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Media', 'GIFs', 'GIF support', 'Try to send and receive one GIF in three chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Media', 'Reactions', 'Emojis and reactions', 'Try to react to three separate messages.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('chat-features', 'Interaction', 'Voice Calls', 'Live voice calling', 'Start three voice calls on three days. Record connection and max length.', 'Successful calls out of three; Yes/Limited/No', { testSize: '3 attempts' });
add('chat-features', 'Interaction', 'Chat Modes', 'Number of chat modes', 'Count selectable modes that visibly change chat behavior.', 'Number of chat modes');
add('chat-features', 'Interaction', 'Mode Types', 'Types of chat modes', 'Open and test each mode with five messages.', 'Number working and list of types');
add('chat-features', 'Interaction', 'Group Chat', 'Multiple characters in one chat', 'Create three group chats; try 2, 3 and 4 AI characters.', 'Yes/Limited/No plus max characters');
add('chat-features', 'Interaction', 'Double Texting', 'Multiple messages before user reply', '10 conversations × 10 user messages = 100 opportunities.', 'Double texts per 100 user messages');
add('chat-features', 'Interaction', 'Proactive Messages', 'Unprompted character messages', 'Keep three active chats open seven days without sending messages.', 'Proactive messages in seven days', { testSize: '7 days' });
add('chat-features', 'Controls', 'Edit Messages', 'Editing sent messages', 'Try to edit three previously sent messages.', 'Successful edits out of three; Yes/Limited/No');
add('chat-features', 'Controls', 'Delete Messages', 'Deleting messages', 'Try to delete three individual messages.', 'Successful deletions out of three; Yes/Limited/No');
add('chat-features', 'Controls', 'Regenerate Replies', 'Regenerating AI replies', 'Try to regenerate three AI replies.', 'Successful regenerations out of three; Yes/Limited/No');
add('chat-features', 'Controls', 'Save Memories', 'Manually saving memories', 'Try to save three separate memories.', 'Saved out of three; Yes/Limited/No');
add('chat-features', 'Controls', 'Edit Memories', 'Viewing and editing memories', 'Try to view, edit and delete three saved memories.', 'Supported actions; Yes/Limited/No');
add('chat-features', 'Controls', 'Reset Chat', 'Resetting conversations', 'Try to reset three separate conversations.', 'Successful resets out of three; Yes/Limited/No');
add('chat-features', 'Controls', 'Export Chat', 'Exporting conversations', 'Try to export three conversations.', 'Successful exports, formats; Yes/Limited/No');

// --- Images ---
const imgTest = '20 generations (10 prompts × 2)';
add('images', 'Quality', 'Realism', 'Visual realism', 'Review 20 images. One point each for realistic face, body, hands, lighting, background.', 'Percentage of 100 realism checks passed', { testSize: imgTest });
add('images', 'Quality', 'Visual Errors', 'Anatomy and visual problems', 'Count images with major issues (extra/missing limbs, broken hands, damaged face, etc.).', 'Number and percentage with major errors', { testSize: imgTest });
add('images', 'Quality', 'Detail', 'Small visual details', 'One point each for facial details, hair, clothing, hands, background.', 'Percentage of 100 detail checks passed', { testSize: imgTest });
add('images', 'Quality', 'Composition', 'Framing and presentation', 'One point each for full visibility, no accidental crop, placement, clear background, balanced framing.', 'Percentage of 100 composition checks passed', { testSize: imgTest });
add('images', 'Quality', 'Resolution', 'Maximum output resolution', 'Download highest-quality image; record width × height in pixels.', 'Maximum resolution in pixels');
add('images', 'Accuracy', 'Prompt Accuracy', 'Instructions followed', 'Each of 10 prompts has five required elements × 2 runs = 100 checks.', 'Percentage of elements produced correctly', { testSize: imgTest });
add('images', 'Accuracy', 'Character Consistency', 'Same character preserved', '10 images of same character. Points for face, hair, body, age, identifying features.', 'Percentage of 50 consistency checks passed', { testSize: imgTest });
add('images', 'Accuracy', 'Face Consistency', 'Face identity preserved', 'Same 10 images; pass when face clearly matches.', 'Percentage of 10 images that pass', { testSize: imgTest });
add('images', 'Accuracy', 'Body Consistency', 'Body characteristics preserved', 'Same 10 images; pass when height, type and proportions consistent.', 'Percentage of 10 images that pass', { testSize: imgTest });
add('images', 'Accuracy', 'Style Consistency', 'Requested visual style', 'Five styles × two images = 10 style tests.', 'Percentage of 10 style tests passed', { testSize: imgTest });
add('images', 'Accuracy', 'Editing Accuracy', 'Only requested part changed', '10 editing tasks; check change made, face/body/pose/background preserved.', 'Percentage of 50 editing checks passed', { testSize: '10 editing tasks' });
add('images', 'Experience', 'Speed', 'Median generation time', 'Time all 20 attempts from submit to finished image.', 'Median time in seconds', { testSize: imgTest, scoreConversion: 'Seconds shown on review; internal score from speed bands' });
add('images', 'Experience', 'Failures', 'Failed generations', 'Count failed, stuck or unusable attempts out of 20.', 'Number and percentage of failures', { testSize: imgTest });
add('images', 'Experience', 'Chat Generation', 'Images inside chat', 'Request one image in three separate chats.', 'Yes, Limited or No');
add('images', 'Experience', 'Separate Generator', 'Dedicated image tool', 'Check for separate generator; create three images through it.', 'Yes, Limited or No');
add('images', 'Experience', 'Custom Prompts', 'Free-form prompting', 'Enter three different free-form prompts.', 'Yes, Limited or No');
add('images', 'Experience', 'Image Editing', 'Basic editing', 'Try change clothing, background, pose.', 'Editing types supported; Yes/Limited/No');
add('images', 'Experience', 'NSFW Support', 'Adult content support', 'Review rules; three allowed adult tests where legal.', 'Yes, Limited, No or Unknown');
add('images', 'Experience', 'Cost', 'Average cost per image', 'Total subscription/token costs for 20-image test ÷ usable images.', 'Average cost per usable image', { goodBad: 'Displayed for context; affects Pricing score only' });

// --- Video ---
const vidTest = '10 videos (5 prompts × 2)';
add('video', 'Capabilities', 'Text-to-Video', 'Text-only video generation', 'Try three videos using only text prompts.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('video', 'Capabilities', 'Image-to-Video', 'Image-to-video generation', 'Try three videos from three source images.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('video', 'Capabilities', 'Chat Video', 'Video inside chat', 'Request one video in three chats.', 'Yes, Limited or No', { testSize: '3 attempts' });
add('video', 'Capabilities', 'Audio', 'Generated sound or speech', 'Generate three videos; check speech, SFX, music separately.', 'Audio types supported; Yes/Limited/No');
add('video', 'Capabilities', 'Maximum Length', 'Longest video duration', 'Record longest selectable length; generate one at max length.', 'Maximum length in seconds');
add('video', 'Capabilities', 'Maximum Resolution', 'Highest output resolution', 'Download highest-quality video; record width × height.', 'Maximum resolution in pixels');
add('video', 'Quality', 'Realism', 'Visual realism of video', 'Review 10 videos. Points for realistic face, body, movement, lighting, environment.', 'Percentage of 50 realism checks passed', { testSize: vidTest });
add('video', 'Quality', 'Motion', 'Natural movement', 'Points for body, facial, hand movement, camera, physics.', 'Percentage of 50 motion checks passed', { testSize: vidTest });
add('video', 'Quality', 'Accuracy', 'Instructions followed', 'Five required elements per prompt × 2 = 50 checks.', 'Percentage of elements correct', { testSize: vidTest });
add('video', 'Quality', 'Character Consistency', 'Character preserved in video', 'Points for face, hair, body, clothing, identifying features per video.', 'Percentage of 50 consistency checks passed', { testSize: vidTest });
add('video', 'Quality', 'Visual Errors', 'Broken faces, limbs or movement', 'Count videos with major errors.', 'Number and percentage with major errors', { testSize: vidTest });
add('video', 'Quality', 'Frame Consistency', 'Stability across frames', 'Points when no major face/body/clothing/object/background flicker changes.', 'Percentage of 50 frame-consistency checks passed', { testSize: vidTest });
add('video', 'Experience', 'Speed', 'Median generation time', 'Time all 10 generations from submit to finished video.', 'Median time in seconds', { testSize: vidTest, scoreConversion: 'Seconds displayed; internal score from speed bands' });
add('video', 'Experience', 'Failures', 'Failed generations', 'Count failed, stuck or unusable out of 10.', 'Number and percentage of failures', { testSize: vidTest });
add('video', 'Experience', 'Ease of Use', 'Steps to create video', 'Create three videos; count clicks/actions from open to start.', 'Average steps across three tests');
add('video', 'Experience', 'Controls', 'Available video controls', 'Count adjustable controls (duration, resolution, aspect, motion, camera, style, audio, negative prompt).', 'Number of available controls');
add('video', 'Experience', 'Regeneration', 'Retry or variations', 'Try to regenerate three finished videos.', 'Successful regenerations out of three; Yes/Limited/No');
add('video', 'Experience', 'Cost', 'Average cost per video', 'Total costs for 10-video test ÷ usable videos.', 'Average cost per usable video', { goodBad: 'Displayed for context; affects Pricing score only' });

// --- Privacy ---
add('privacy', 'Data Use', 'Training', 'Chats used for AI training', 'Search privacy policy, terms, help and settings for clear training statement.', 'Yes, No or Unknown with source and date');
add('privacy', 'Data Use', 'Human Review', 'Humans may review chats', 'Search policy, terms and help for employee/contractor review statement.', 'Yes, No or Unknown with source and date');
add('privacy', 'Data Use', 'Data Sharing', 'Third-party data sharing', 'Review list of third parties; count categories.', 'Yes, Limited, No or Unknown plus count');
add('privacy', 'Data Use', 'Advertising', 'Personal data for advertising', 'Check policy and settings for advertising/profiling.', 'Yes, No or Unknown');
add('privacy', 'Data Use', 'Retention', 'Data storage duration', 'Record stated periods for chats, account, payment, deleted data.', 'Period for each type or Unknown');
add('privacy', 'Data Use', 'Policy Clarity', 'Clarity of data practices', 'Check six questions: training, human review, sharing, deletion, retention, security.', 'Percentage of six questions clearly answered');
add('privacy', 'User Control', 'Delete Chats', 'Deleting conversations', 'Create three chats; try to delete each.', 'Deleted out of three; Yes/Limited/No');
add('privacy', 'User Control', 'Delete Account', 'Account deletion', 'Check if available in settings; count steps required.', 'Yes/Limited/No plus steps');
add('privacy', 'User Control', 'Delete Personal Data', 'Personal data deletion request', 'Check if users can request deletion of data outside visible account.', 'Yes, No or Unknown');
add('privacy', 'User Control', 'Training Opt-Out', 'Opt out of training', 'Check settings, policy and help for training opt-out.', 'Yes, Limited, No or Unknown');
add('privacy', 'User Control', 'Export Data', 'Data export', 'Request export of test account data; record if within 30 days.', 'Yes/Limited/No plus days required');
add('privacy', 'User Control', 'Consent Controls', 'Privacy settings available', 'Count separate controls (training opt-out, marketing, cookies, sharing, profile, chat history).', 'Number of privacy controls');
add('privacy', 'Security', 'Encryption', 'Stated data protection', 'Check for encryption in transit, at rest, end-to-end. Do not assume if unstated.', 'Number of three types confirmed');
add('privacy', 'Security', 'Account Security', 'Account protections', 'Check five: password requirements, login alerts, session management, recovery, suspicious-login protection.', 'Number and percentage of five available');
add('privacy', 'Security', 'Two-Factor Authentication', '2FA availability', 'Try to enable 2FA on test account.', 'Yes/Limited/No plus method');
add('privacy', 'Security', 'Billing Privacy', 'Discreet bank statement', 'Make test payment; check statement descriptor.', 'Discreet or Not Discreet plus billing name');
add('privacy', 'Security', 'Billing Descriptor', 'Descriptor shown before payment', 'Check checkout and payment help pages.', 'Yes, No or Unknown');
add('privacy', 'Security', 'Security Incidents', 'Known data breaches', 'Search confirmed incidents from previous five years (company, regulator, court, reliable report).', 'Number of confirmed incidents or Unknown');

// --- Pricing ---
add('pricing', 'Subscription', 'Monthly Price', 'Standard monthly subscription', 'Record full non-discounted main monthly price.', 'Monthly price');
add('pricing', 'Subscription', 'Annual Price', 'Effective monthly on annual plan', 'Record total annual payment ÷ 12.', 'Total annual and effective monthly price');
add('pricing', 'Subscription', 'Free Plan', 'Free account availability', 'Create free account; use seven days; record if payment required.', 'Yes, Limited or No', { testSize: '7 days' });
add('pricing', 'Subscription', 'Free Trial', 'Trial before payment', 'Record trial length, credits, features, payment details required.', 'Yes, Limited or No');
add('pricing', 'Subscription', 'Included Credits', 'Credits in subscription', 'Record exact credits/tokens per billing period.', 'Credits per period');
add('pricing', 'Subscription', 'Included Features', 'Features without extra payment', '10-feature checklist: chat, library, creation, images, editing, video, voice msg, calls, memory, regenerate.', 'Number and percentage of 10 included');
add('pricing', 'Subscription', 'Plan Limits', 'Usage limits', 'Record daily/monthly limits for messages, images, video, voice, characters.', 'Exact limit per feature or Unknown');
add('pricing', 'Extra Costs', 'Image Cost', 'Cost per image', 'Credits per standard image × cheapest credit package price.', 'Cost per standard image');
add('pricing', 'Extra Costs', 'Video Cost', 'Cost per video', 'Credits per standard video (same length/resolution as other platforms).', 'Cost per standard video');
add('pricing', 'Extra Costs', 'Voice Cost', 'Voice costs', 'Cost of one voice message and one minute of calling.', 'Cost per message and per minute');
add('pricing', 'Extra Costs', 'Top-Ups', 'Credit packages', 'Smallest and largest packages: price, credits, cost per credit.', 'Smallest, largest, cost per credit');
add('pricing', 'Extra Costs', 'Credit Expiry', 'Credits expire', 'Check pricing terms and balance info.', 'Yes, No or Unknown plus expiry period');
add('pricing', 'Extra Costs', 'Feature Paywalls', 'Features behind paywall', 'Same 10 features; count requiring higher plan, credits or purchase.', 'Number and percentage behind paywall');
add('pricing', 'Extra Costs', 'Refunds', 'Refund policy', 'Record allowed, period, restrictions.', 'Yes, Limited, No or Unknown');
add('pricing', 'Value', 'Real Cost', 'Monthly cost for regular use', 'Regular use: 500 msgs, 20 images, 4 videos, 30 voice min + sub + top-ups + fees.', 'Estimated monthly cost', { testSize: 'Regular-use scenario' });
add('pricing', 'Value', 'Heavy-Use Cost', 'Monthly cost for heavy use', 'Heavy use: 2000 msgs, 100 images, 20 videos, 120 voice min.', 'Estimated monthly cost', { testSize: 'Heavy-use scenario' });
add('pricing', 'Value', 'Category Comparison', 'Vs category average', '(Platform regular cost − average) ÷ average × 100. Only when 10+ platforms measured.', 'Percentage above or below average');
add('pricing', 'Value', 'Feature Value', 'Features for total price', 'Same 10-feature checklist within regular-use cost.', 'Number and percentage included');
add('pricing', 'Value', 'Usage Value', 'Usable content per dollar', 'Count successful replies, images, videos, voice minutes from standard tests per $10 spent.', 'Usable outputs per $10');
add('pricing', 'Value', 'Pricing Clarity', 'Costs explained before payment', 'Eight items: sub price, renewal, credits, image cost, video cost, limits, expiry, refunds.', 'Percentage of eight clearly shown');

const lookup = new Map<string, MethodologyEntry>();
for (const e of entries) {
  lookup.set(`${toSlug(e.category)}/${toSlug(e.subscore)}/${toSlug(e.contributor)}`, e);
}

export function getMethodology(category: string, subscore: string, contributor: string): MethodologyEntry | undefined {
  return lookup.get(`${toSlug(category)}/${toSlug(subscore)}/${toSlug(contributor)}`);
}

export function getAllMethodologyEntries(): MethodologyEntry[] {
  return entries;
}
