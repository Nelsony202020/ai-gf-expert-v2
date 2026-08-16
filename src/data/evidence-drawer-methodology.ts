// Auto-generated from static drawer copy — do not edit by hand.
// Regenerate: npx tsx scripts/generate-evidence-drawer-methodology.ts <copy.md>

export interface SubscoreMethodologyCopy {
  whatItMeasures: string;
  scoreCalculation: string;
}

export interface EvidenceMethodologyCopy {
  whatItMeasures: string;
  howWeTested: string;
}

export const SUBSCORE_METHODOLOGY: Record<string, SubscoreMethodologyCopy> = {
  'characters/discovery': {
    whatItMeasures: 'Checks how easy it is to find a character that matches what you want.',
    scoreCalculation: 'This score combines Filters, Categories, Search, and Browsing.',
  },
  'characters/quality': {
    whatItMeasures: 'Checks whether the ready-made characters feel original, complete, and well made.',
    scoreCalculation: 'This score combines Duplicates, Originality, Profile Quality, and Visual Quality.',
  },
  'characters/variety': {
    whatItMeasures: 'Checks how much choice the ready-made character library gives you across character types, looks, personalities, and story setups.',
    scoreCalculation: 'This score combines Amount, Styles, Genders, Ethnicities, Personalities, and Scenarios.',
  },
  'chat-features/controls': {
    whatItMeasures: 'Checks how much control you have over messages, memories, and the conversation itself.',
    scoreCalculation: 'This score combines Edit Messages, Delete Messages, Regenerate Replies, Save Memories, Edit Memories, Reset Chat, and Export Chat.',
  },
  'chat-features/interaction': {
    whatItMeasures: 'Checks which features make conversations feel more active than normal one-to-one text chat.',
    scoreCalculation: 'This score combines AI phone calls, Chat Modes, Mode Types, Group Chat, Double Texting, and Proactive Messages.',
  },
  'chat-features/media': {
    whatItMeasures: 'Checks which types of media you and the AI can send inside the chat.',
    scoreCalculation: 'This score combines Images you can send, In-chat images, Voice messages you can send, Voice message generation, In-chat video, GIFs, and Reactions.',
  },
  'chat-features/platform-extras': {
    whatItMeasures: 'Checks whether the app offers bigger experiences beyond normal chat, images, video, and calls.',
    scoreCalculation: 'Live Cam affects the score. Other Extras are shown for information and do not affect the score.',
  },
  'chat/realism': {
    whatItMeasures: 'Checks whether chatting feels natural, believable, and emotionally engaging.',
    scoreCalculation: 'This score combines Naturalness, Personality, Roleplay, Initiative, Emotion, and Style.',
  },
  'chat/reliability': {
    whatItMeasures: 'Checks whether the chat works well without too much repetition, refusals, slow replies, errors, or contradictions.',
    scoreCalculation: 'This score combines Repetition, Refusals, Reply Speed, Errors, Consistency, and Recovery.',
  },
  'chat/understanding': {
    whatItMeasures: 'Checks whether the AI understands you, remembers important details, and follows the conversation.',
    scoreCalculation: 'This score combines Memory, Relevance, Context, Instructions, and Roleplay Accuracy.',
  },
  'customization/appearance': {
    whatItMeasures: 'Checks how much control you have over the character’s look when creating your own AI companion.',
    scoreCalculation: 'This score combines Age, Ethnicity, Eye Color, Body Type, Breast Size, Hair Style, Hair Color, Outfits, and Personality Presets.',
  },
  'customization/control': {
    whatItMeasures: 'Checks how much freedom you have to add your own instructions, make changes, and preview the character.',
    scoreCalculation: 'This score combines Custom Prompts, Editing, and Preview.',
  },
  'customization/personality': {
    whatItMeasures: 'Checks how much control you have over who the character is, how they act, and what kind of relationship you have.',
    scoreCalculation: 'This score combines Traits, Interests, Relationship, Role, Voice, and Kink Options.',
  },
  'images/accuracy': {
    whatItMeasures: 'Checks whether images follow your request and keep the same character looking consistent.',
    scoreCalculation: 'This score combines Prompt Accuracy, Character Consistency, Face Consistency, Body Consistency, Style Consistency, and Editing Accuracy.',
  },
  'images/experience': {
    whatItMeasures: 'Checks how fast, reliable, flexible, and easy the image tools are to use.',
    scoreCalculation: 'This score combines Speed, Failures, Chat Generation, Separate Generator, Custom Prompts, Image Editing, and NSFW Support.',
  },
  'images/quality': {
    whatItMeasures: 'Checks how realistic, clear, and well made the generated images look.',
    scoreCalculation: 'This score combines Realism, Visual Errors, Composition, and Resolution.',
  },
  'pricing/billing': {
    whatItMeasures: 'Checks whether prices, credits, refunds, cancellation, and payment details are clear and fair.',
    scoreCalculation: 'This score combines Pricing Clarity, Paywalls, Credit Expiry, Refunds, Cancellation, and Payment Privacy.',
  },
  'pricing/free-access': {
    whatItMeasures: 'Checks how much of the app you can properly try before paying.',
    scoreCalculation: 'This score combines Free Chat, Free Images, Free Video, Free Voice, Free Characters, Free Value, and Restrictions.',
  },
  'pricing/plan-value': {
    whatItMeasures: 'Checks what you actually get for the subscription price.',
    scoreCalculation: 'This score combines Monthly Price, Annual Price, Included Features, Included Credits, Plan Limits, and Annual Discount.',
  },
  'pricing/usage-costs': {
    whatItMeasures: 'Checks what paid features really cost after you start using the app.',
    scoreCalculation: 'This score combines Image Cost, Video Cost, Voice Cost, Call Cost, Top-Up Value, and Monthly Spend.',
  },
  'privacy/data-use': {
    whatItMeasures: 'Checks what the company says it does with your chats, photos, and personal data.',
    scoreCalculation: 'This score combines Training, Human Review, Data Sharing, Advertising, Retention, and Policy Clarity.',
  },
  'privacy/security': {
    whatItMeasures: 'Checks how the platform protects your account, data, and private billing details.',
    scoreCalculation: 'This score combines Encryption, Two-Factor Authentication, Billing Descriptor, and Security Incidents.',
  },
  'privacy/support': {
    whatItMeasures: 'Checks how easy it is to reach support and whether the help is fast and useful.',
    scoreCalculation: 'Ease of Contact, Response Speed, and Helpfulness affect the score. Support Available and Support Channels are shown for information only.',
  },
  'privacy/user-control': {
    whatItMeasures: 'Checks how much control you have over your chats, account, and personal data.',
    scoreCalculation: 'This score combines Delete Chats, Delete Account, Delete Personal Data, Training Opt-Out, and Export Data.',
  },
  'video/capabilities': {
    whatItMeasures: 'Checks what types of AI video the app can create and the limits of those videos.',
    scoreCalculation: 'This score combines Text-to-Video, Image-to-Video, In-chat video, Audio, Maximum Length, and Maximum Resolution.',
  },
  'video/experience': {
    whatItMeasures: 'Checks how fast, reliable, and easy the video tools are to use.',
    scoreCalculation: 'This score combines Speed, Failures, Ease of Use, and Regeneration.',
  },
  'video/quality': {
    whatItMeasures: 'Checks how smooth, accurate, stable, and well made the generated videos look.',
    scoreCalculation: 'This score combines Motion, Prompt Accuracy, Character Consistency, Visual Errors, and Frame Consistency.',
  },
};

export const EVIDENCE_METHODOLOGY: Record<string, EvidenceMethodologyCopy> = {
  'characters/discovery/browsing': {
    whatItMeasures: 'Checks how easy it is to explore the library when you do not already know what you want.',
    howWeTested: 'We completed the 10 fixed browsing tasks in our testing guide. We wrote down whether each task works smoothly, takes unnecessary extra steps, feels confusing, or cannot be completed.',
  },
  'characters/discovery/categories': {
    whatItMeasures: 'Checks whether the library is split into useful groups that make characters easier to find.',
    howWeTested: 'We counted categories that lead to meaningfully different groups of characters.',
  },
  'characters/discovery/filters': {
    whatItMeasures: 'Checks whether you can narrow the library by things such as style, gender, personality, or scenario.',
    howWeTested: 'We opened the full character library and counted every filter that meaningfully narrows the available characters.',
  },
  'characters/discovery/search': {
    whatItMeasures: 'Checks whether you can search for a specific character, trait, or keyword.',
    howWeTested: 'We searched for three existing character names and three general keywords. The keywords describe a character type, personality, style, or scenario rather than an exact profile name.',
  },
  'characters/quality/duplicates': {
    whatItMeasures: 'Checks whether the library repeats the same characters, images, or profiles.',
    howWeTested: 'We reviewed the same 25 characters and looked for copied or near-copied profiles.',
  },
  'characters/quality/originality': {
    whatItMeasures: 'Checks whether characters feel meaningfully different instead of looking like small changes to the same idea.',
    howWeTested: 'We reviewed the same 25 characters and checked whether the looks, personalities, and scenarios were actually different.',
  },
  'characters/quality/profile-quality': {
    whatItMeasures: 'Checks whether character profiles give enough useful information before you start chatting.',
    howWeTested: 'We reviewed the same 25 characters and checked whether each profile had a name, clear description, personality, scenario, and opening message.',
  },
  'characters/quality/visual-quality': {
    whatItMeasures: 'Checks whether character profile images look clear, polished, and free from obvious AI mistakes.',
    howWeTested: 'We reviewed the same 25 characters and checked each main profile image for a clear face, clear body, major anatomy errors, image damage, and overall presentation.',
  },
  'characters/variety/amount': {
    whatItMeasures: 'Checks how many ready-made female, male, anime female, and anime male characters are available.',
    howWeTested: 'We opened the full character library and counted every ready-made female, male, anime female, and anime male character shown by the platform.',
  },
  'characters/variety/ethnicities': {
    whatItMeasures: 'Checks how many ethnicity options are represented in the character library.',
    howWeTested: 'We counted the ethnicity categories shown in the library, filters, or character labels.',
  },
  'characters/variety/genders': {
    whatItMeasures: 'Checks whether the library includes transgender, non-binary, and other gender options outside the main female and male groups.',
    howWeTested: 'We opened the full character library and counted every character clearly labelled as transgender, non-binary, or another gender group. We did not guess gender from appearance.',
  },
  'characters/variety/personalities': {
    whatItMeasures: 'Checks how many different personality types users can choose from in the ready-made character library.',
    howWeTested: 'We counted personality categories and filters shown in the character library.',
  },
  'characters/variety/scenarios': {
    whatItMeasures:
      'Checks if there are different roleplay scenarios or chat modes besides the regular chat.',
    howWeTested:
      'We counted all chat modes and roleplay scenarios users can select. This includes both the character library and the custom AI character section.',
  },
  'characters/variety/styles': {
    whatItMeasures: 'Checks how many different visual styles are available, such as realistic, anime, or fantasy characters.',
    howWeTested: 'We reviewed the full library and counted clearly different styles such as realistic, anime, 2D cartoon, 3D render, and fantasy.',
  },
  'chat-features/controls/delete-messages': {
    whatItMeasures: 'Checks whether individual messages can be removed from a conversation.',
    howWeTested: 'We tested this 3 times. deleted sent and received messages and checked what disappeared from the chat.',
  },
  'chat-features/controls/edit-memories': {
    whatItMeasures: 'Checks whether saved memories can be changed or removed.',
    howWeTested: 'We tested this 3 times. opened the memory controls and tried editing and deleting saved information.',
  },
  'chat-features/controls/edit-messages': {
    whatItMeasures: 'Checks whether you can change a message after sending it.',
    howWeTested: 'We tested this 3 times. sent a message, edited it, and checked whether the conversation updated correctly.',
  },
  'chat-features/controls/export-chat': {
    whatItMeasures: 'Checks whether you can download or copy your conversation history.',
    howWeTested: 'We tested this 3 times. looked for an export option and tested the file or text it produced.',
  },
  'chat-features/controls/regenerate-replies': {
    whatItMeasures: 'Checks whether you can ask the AI for a different answer without sending a new message.',
    howWeTested: 'We tested this 3 times. regenerated several replies and checked whether the new versions were meaningfully different.',
  },
  'chat-features/controls/reset-chat': {
    whatItMeasures: 'Checks whether you can start the conversation over with a clean chat history.',
    howWeTested: 'We tested this 3 times. used the reset option and checked what happened to messages, memories, and the character.',
  },
  'chat-features/controls/save-memories': {
    whatItMeasures: 'Checks whether important details can be saved as long-term memories.',
    howWeTested: 'We tested this 3 times. saved a personal detail and later checked whether it remained available to the character.',
  },
  'chat-features/interaction/chat-modes': {
    whatItMeasures: 'Checks whether the chat offers different modes for different kinds of conversations.',
    howWeTested: 'We counted every selectable mode that creates a noticeable change in the conversation. A different name or icon is not enough.',
  },
  'chat-features/interaction/double-texting': {
    whatItMeasures: 'Checks whether the AI can send more than one message before you reply.',
    howWeTested: 'During normal chat testing, we send a message and wait without replying. We counted each time the character sends two or more separate messages before our next message.',
  },
  'chat-features/interaction/group-chat': {
    whatItMeasures: 'Checks whether you can chat with more than one AI character at the same time.',
    howWeTested: 'We created three group chats. We tried adding two AI characters, three AI characters, and four AI characters.',
  },
  'chat-features/interaction/mode-types': {
    whatItMeasures: 'Shows what kinds of chat modes are available, such as roleplay, relationship, or uncensored modes.',
    howWeTested: 'We select two available modes. We sent five messages in each mode and check whether the conversation clearly changes.',
  },
  'chat-features/interaction/proactive-messages': {
    whatItMeasures: 'Checks whether the AI can message you without waiting for you to start the conversation.',
    howWeTested: 'We keep three active chats open for seven days. We do not send any new messages during the test.',
  },
  'chat-features/interaction/voice-calls': {
    whatItMeasures: 'Checks whether you can have a live voice call with the AI.',
    howWeTested: 'We start three voice calls on three different days. For each call, we record whether it connects, whether the audio works, whether the conversation continues normally, and the maximum call length allowed.',
  },
  'chat-features/media/chat-video': {
    whatItMeasures: 'Checks whether videos can be created or received directly inside the chat.',
    howWeTested: 'We tested this 3 times. tried the available chat-video controls and checked whether the finished video appeared in the conversation.',
  },
  'chat-features/media/gifs': {
    whatItMeasures: 'Checks whether GIFs can be sent or received during chat.',
    howWeTested: 'We tested this 3 times. looked for GIF controls and tested sending or receiving a GIF when supported.',
  },
  'chat-features/media/images-received': {
    whatItMeasures: 'Checks whether the AI can send images directly inside the conversation.',
    howWeTested: 'We tested this 3 times. asked for images during chat and recorded whether they appeared in the conversation.',
  },
  'chat-features/media/images-sent': {
    whatItMeasures: 'Checks whether you can upload or send your own images in chat.',
    howWeTested: 'We tested this 3 times. tried sending supported image files and checked whether the character could receive and respond to them.',
  },
  'chat-features/media/reactions': {
    whatItMeasures: 'Checks whether users or characters can react to messages with emojis or similar quick responses.',
    howWeTested: 'We tested this 3 times. checked whether reactions were available and whether they worked on sent and received messages.',
  },
  'chat-features/media/voice-received': {
    whatItMeasures: 'Checks whether the AI can reply with voice messages.',
    howWeTested: 'We tested this 3 times. requested voice replies and reviewed whether they played correctly and matched the conversation.',
  },
  'chat-features/media/voice-sent': {
    whatItMeasures: 'Checks whether you can send a voice recording to the AI.',
    howWeTested: 'We tested this 3 times. recorded and sent voice messages, then checked whether they uploaded and were understood correctly.',
  },
  'chat-features/platform-extras/live-cam': {
    whatItMeasures: 'Checks whether the app offers a live AI camera experience and how much you can do with it.',
    howWeTested: 'We opened the Live Cam feature through a paid account. We checked whether the feature opens, a character appears on video, the experience can be used normally, important restrictions affect access, and the app clearly shows which characters are supported.',
  },
  'chat-features/platform-extras/other-extras': {
    whatItMeasures: 'Shows any unusual platform features that do not fit into normal chat, images, video, or calls.',
    howWeTested: 'We explore the app and record each notable extra we can access. For every feature, we add a short name, a simple description, an optional note, and supporting proof.',
  },
  'chat-features/platform-extras/platform-extras': {
    whatItMeasures: 'Checks whether the app offers bigger experiences beyond normal chat, images, video, and calls.',
    howWeTested: 'We opened Live Cam when available, reviewed other bonus features on the platform, and recorded what each feature does.',
  },
  'chat/realism/emotion': {
    whatItMeasures: 'Checks whether the AI responds to feelings in a believable and suitable way.',
    howWeTested: 'We used five emotional situations in each of the five chats: happy, sad, angry, nervous, and romantic. This creates 25 emotional-response tests.',
  },
  'chat/realism/initiative': {
    whatItMeasures: 'Checks whether the AI helps move the conversation forward without waiting for you to lead every message.',
    howWeTested: 'We used 10 open-ended messages in each of the five chats. This creates 50 chances for the character to take initiative.',
  },
  'chat/realism/naturalness': {
    whatItMeasures: 'Checks whether replies sound like a normal conversation instead of stiff or robotic writing.',
    howWeTested: 'We reviewed 100 AI replies from 5 chats. Each reply was checked for natural wording, suitable length, clear flow, and no robotic or copy-paste language.',
  },
  'chat/realism/personality': {
    whatItMeasures: 'Checks whether the character’s personality comes through clearly and stays recognizable while chatting.',
    howWeTested: 'Each of the five tested characters has three clear personality traits. We reviewed all 20 replies in each chat.',
  },
  'chat/realism/roleplay': {
    whatItMeasures: 'Checks whether roleplay feels active, detailed, and enjoyable instead of flat or repetitive.',
    howWeTested: 'We reviewed the roleplay inside all five chats. Each chat receives one point for every check it passes: stays in character, adds useful details, responds to the user’s actions, keeps the story consistent, and moves the scenario forward.',
  },
  'chat/realism/style': {
    whatItMeasures: 'Checks whether the AI uses a suitable writing style, including message length, actions, tone, and formatting.',
    howWeTested: 'We reviewed 100 AI replies from 5 chats and checked whether each reply matched the communication style chosen for that character.',
  },
  'chat/reliability/consistency': {
    whatItMeasures: 'Checks whether chat quality stays steady across different sessions and topics.',
    howWeTested: 'We checked 25 facts across 5 chats and counted every time the AI later contradicted one of them.',
  },
  'chat/reliability/errors': {
    whatItMeasures: 'Checks how often chats fail because of loading errors, broken replies, or system problems.',
    howWeTested: 'We reviewed 100 AI replies from 5 chats and counted replies that were cut off, empty, broken, nonsensical, or unrelated.',
  },
  'chat/reliability/recovery': {
    whatItMeasures: 'Checks whether the AI can fix a mistake after you point it out.',
    howWeTested: 'We created one clear misunderstanding in each of 5 chats, corrected it, and checked whether the AI fixed the mistake within its next two replies.',
  },
  'chat/reliability/refusals': {
    whatItMeasures: 'Checks whether the AI refuses requests that the platform claims to support.',
    howWeTested: 'We sent 25 prompts that followed the platform’s rules and counted how many were refused without a good reason.',
  },
  'chat/reliability/repetition': {
    whatItMeasures: 'Checks how often the AI repeats the same words, ideas, questions, or actions.',
    howWeTested: 'We reviewed 100 AI replies from 5 chats and counted replies that repeated the same sentence, idea, or answer pattern without a good reason.',
  },
  'chat/reliability/reply-speed': {
    whatItMeasures: 'Checks how long the AI usually takes to answer.',
    howWeTested: 'We timed 25 replies from the moment the message was sent until the full answer finished. We used the middle result so one unusually fast or slow reply did not control the score.',
  },
  'chat/understanding/context': {
    whatItMeasures: 'Checks whether the AI follows what is happening across a longer conversation.',
    howWeTested: 'We created a short multi-message exchange in each of the five chats. Later, we send a message that only makes sense when the AI remembers and understands the earlier parts of the conversation.',
  },
  'chat/understanding/instructions': {
    whatItMeasures: 'Checks how well the AI follows clear requests about tone, format, behavior, or what to do next.',
    howWeTested: 'We give the same three rules in each of the five chats: call me Herman, keep replies under three sentences, and do not use emojis. We checked each rule separately.',
  },
  'chat/understanding/memory': {
    whatItMeasures: 'Checks whether the AI remembers important facts from earlier messages and later conversations.',
    howWeTested: 'We give the AI five facts in each of the five chats. Later in the conversation, we ask questions to see whether it still remembers them.',
  },
  'chat/understanding/relevance': {
    whatItMeasures: 'Checks whether replies actually answer what you said instead of changing the subject or giving generic responses.',
    howWeTested: 'We ask five direct questions in each of the five chats. A reply passes when it clearly answers the question and stays on topic.',
  },
  'chat/understanding/roleplay-accuracy': {
    whatItMeasures: 'Checks whether the AI follows the roleplay setup and keeps important story details correct.',
    howWeTested: 'We used the same hotel-bar roleplay in all five chats. Each conversation receives one point for every check it passes: starts the scenario correctly, stays in character, remembers the setting, responds properly to actions, and does not contradict or break the scene.',
  },
  'customization/appearance/age': {
    whatItMeasures: 'Checks how many adult age options are available during character creation.',
    howWeTested: 'We counted the selectable adult age options. When the creator uses a minimum and maximum age instead of presets, we record the available adult age range.',
  },
  'customization/appearance/body-type': {
    whatItMeasures: 'Checks how much control you have over the character’s body shape.',
    howWeTested: 'We counted every body-type preset or clearly separate body control offered in the creator.',
  },
  'customization/appearance/breast-size': {
    whatItMeasures: 'Checks whether breast size can be changed and how many options are offered.',
    howWeTested: 'We counted every clearly selectable breast-size option shown for adult characters.',
  },
  'customization/appearance/ss-size': {
    whatItMeasures: 'Checks whether ass size can be changed and how many options are offered.',
    howWeTested: 'We counted every clearly selectable ass size option shown for adult characters.',
  },
  'customization/appearance/ethnicity': {
    whatItMeasures: 'Checks which ethnicity options you can choose when creating a character.',
    howWeTested: 'We counted every ethnicity option clearly shown inside the character creator. We only use the labels provided by the platform.',
  },
  'customization/appearance/eye-color': {
    whatItMeasures: 'Checks how many eye colors can be selected.',
    howWeTested: 'We counted every clearly selectable eye color.',
  },
  'customization/appearance/hair-color': {
    whatItMeasures: 'Checks how many hair colors can be selected.',
    howWeTested: 'We counted every selectable hair-color option.',
  },
  'customization/appearance/hair-style': {
    whatItMeasures: 'Checks how many different hairstyles are available.',
    howWeTested: 'We counted every clearly different hairstyle available in the creator.',
  },
  'customization/appearance/outfits': {
    whatItMeasures: 'Checks how many clothing and outfit options are available during creation.',
    howWeTested: 'We counted every separate outfit or clothing option available in the creator.',
  },
  'customization/appearance/personality-presets': {
    whatItMeasures: 'Checks whether you can choose a ready-made personality while creating the character.',
    howWeTested: 'We counted every basic personality preset available during the creation process.',
  },
  'customization/control/custom-prompts': {
    whatItMeasures: 'Checks whether you can write your own instructions instead of only choosing preset options.',
    howWeTested: 'We created 5 characters from our own written instructions and checked how many matched the request.',
  },
  'customization/control/editing': {
    whatItMeasures: 'Checks whether you can change the character after creating it.',
    howWeTested: 'We created 5 characters and tried to change the appearance, personality, relationship, voice, and name after saving.',
  },
  'customization/control/preview': {
    whatItMeasures: 'Checks whether you can see the character and review your choices before finishing.',
    howWeTested: 'We created 5 characters and checked whether a useful picture or written summary appeared before each one was saved.',
  },
  'customization/personality/interests': {
    whatItMeasures: 'Checks whether you can choose the character’s hobbies and interests.',
    howWeTested: 'We counted every selectable interest shown in the creator. We also check whether you can enter your own custom interest.',
  },
  'customization/personality/kink-options': {
    whatItMeasures: 'Checks whether adult preferences can be selected during character creation.',
    howWeTested: 'We counted every kink or intimacy preference shown in the character creator.',
  },
  'customization/personality/relationship': {
    whatItMeasures: 'Checks which relationship types you can choose, such as girlfriend, friend, wife, or stranger.',
    howWeTested: 'We counted every selectable relationship type and chat style shown in the creator.',
  },
  'customization/personality/role': {
    whatItMeasures: 'Checks which jobs, identities, or story roles you can give the character.',
    howWeTested: 'We counted all preset roles, occupations, and backgrounds shown in the creator. We also check whether you can enter your own custom role.',
  },
  'customization/personality/traits': {
    whatItMeasures: 'Checks which personality traits you can give the character, such as shy, confident, caring, or dominant.',
    howWeTested: 'We counted every selectable personality trait in the character creator. We also record the maximum number of traits that can be selected for one character.',
  },
  'customization/personality/voice': {
    whatItMeasures: 'Checks how many voices you can choose and how much control you have over how the character sounds.',
    howWeTested: 'We counted every selectable voice. We then test three voices to make sure the options sound noticeably different.',
  },
  'images/accuracy/body-consistency': {
    whatItMeasures: 'Checks whether the character’s body shape stays consistent across repeated images.',
    howWeTested: 'We made 5 new images from one reference character and compared the body type and proportions in every image with the reference.',
  },
  'images/accuracy/character-consistency': {
    whatItMeasures: 'Checks whether the same character still looks like the same person across several images.',
    howWeTested: 'We made 5 new images from one reference character and checked whether the same person, body, and visual style stayed recognizable.',
  },
  'images/accuracy/editing-accuracy': {
    whatItMeasures: 'Checks whether image edits change only what was requested.',
    howWeTested: 'We completed 10 image edits. For every edit, we checked whether the requested change was made and whether the face, body, pose, and background stayed the same.',
  },
  'images/accuracy/face-consistency': {
    whatItMeasures: 'Checks whether the character’s face stays recognizable across different images.',
    howWeTested: 'We made 5 new images from one reference character and compared the face in every image with the reference.',
  },
  'images/accuracy/prompt-accuracy': {
    whatItMeasures: 'Checks whether the image includes the details asked for in the prompt.',
    howWeTested: 'We generated 10 images from prompts with five clear details and checked which requested details appeared correctly.',
  },
  'images/accuracy/style-consistency': {
    whatItMeasures: 'Checks whether the chosen visual style stays the same across several images.',
    howWeTested: 'We made 5 new images from one reference character and checked whether every image kept the same visual style.',
  },
  'images/experience/chat-generation': {
    whatItMeasures: 'Checks whether images can be created directly inside a conversation.',
    howWeTested: 'We requested one image in three separate chats. We checked whether the request works and whether the image appears inside the conversation.',
  },
  'images/experience/custom-prompts': {
    whatItMeasures: 'Checks whether you can write your own image prompt.',
    howWeTested: 'We entered three different free-form prompts. We checked whether each prompt is accepted and whether major restrictions affect what can be entered.',
  },
  'images/experience/failures': {
    whatItMeasures: 'Checks how often image generation fails or produces no usable result.',
    howWeTested: 'We wrote down every failed attempt during the image-generation test. An attempt fails when it produces no image, remains stuck, shows a generation error, or produces a result that is completely unusable.',
  },
  'images/experience/image-editing': {
    whatItMeasures: 'Checks whether existing images can be changed after generation.',
    howWeTested: 'We tried three basic editing tasks: change the clothing, change the background, and change the pose. We wrote down how many editing types are supported.',
  },
  'images/experience/nsfw-support': {
    whatItMeasures: 'Checks whether adult image generation is supported and how much control users have over it.',
    howWeTested: 'We read the platform’s current rules and help pages. Where legally appropriate, we complete three allowed adult-content tests.',
  },
  'images/experience/separate-generator': {
    whatItMeasures: 'Checks whether the app includes a full image generator outside the chat.',
    howWeTested: 'We checked whether the platform has a separate image-generation page or tool. When available, we create three images through it.',
  },
  'images/experience/speed': {
    whatItMeasures: 'Checks how long it takes to create an image.',
    howWeTested: 'We timed the image-generation attempts. The timer starts when we submit the generation and stops when the finished image is available.',
  },
  'images/quality/composition': {
    whatItMeasures: 'Checks whether the subject, pose, background, and framing are arranged well.',
    howWeTested: 'We generated 10 images and checked every one for cropping, subject placement, background clarity, and balanced framing.',
  },
  'images/quality/realism': {
    whatItMeasures: 'Checks how believable and natural the generated people and scenes look.',
    howWeTested: 'We generated 10 images and checked every one for realistic faces, bodies, hands, lighting, and backgrounds.',
  },
  'images/quality/resolution': {
    whatItMeasures: 'Checks the size and sharpness of the finished image.',
    howWeTested: 'We generated an image using the highest quality setting available. We downloaded the finished file and record its exact width and height in pixels.',
  },
  'images/quality/visual-errors': {
    whatItMeasures: 'Checks how often images contain obvious AI mistakes such as broken hands, warped faces, or extra body parts.',
    howWeTested: 'We generated 10 images and checked every one for broken hands, damaged faces, extra or missing body parts, merged objects, broken clothing, and badly distorted backgrounds.',
  },
  'pricing/billing/cancellation': {
    whatItMeasures: 'Checks how easy it is to stop the subscription.',
    howWeTested: 'We opened the paid account settings and look for the cancellation option. We wrote down whether self-service cancellation exists, how many steps are required, whether support must be contacted, and whether the end date is clearly shown.',
  },
  'pricing/billing/credit-expiry': {
    whatItMeasures: 'Checks whether paid or included credits expire.',
    howWeTested: 'We checked pricing terms, the credit purchase page, account balance, help pages, and subscription rules. We wrote down whether credits expire and, when possible, the exact expiry period.',
  },
  'pricing/billing/payment-privacy': {
    whatItMeasures: 'Checks whether payments can be made discreetly and securely.',
    howWeTested: 'We checked the checkout page, payment help pages, billing information, expected bank-statement name, and available payment methods. We wrote down whether the billing name is discreet and whether it is shown before payment.',
  },
  'pricing/billing/paywalls': {
    whatItMeasures: 'Checks whether important features are locked behind extra payments after subscribing.',
    howWeTested: 'We checked the same 10 core features used in Included Features: standard chat, character library, character creation, image generation, image editing, video generation, voice messages, voice calls, memory controls, and message regeneration. We counted how many require an extra payment.',
  },
  'pricing/billing/pricing-clarity': {
    whatItMeasures: 'Checks whether users can understand the full cost before paying.',
    howWeTested: 'We checked the pricing and checkout pages before completing payment. Each clearly explained item receives one point.',
  },
  'pricing/billing/refunds': {
    whatItMeasures: 'Checks whether refunds are available and what rules apply.',
    howWeTested: 'We reviewed the current refund policy. We wrote down whether refunds are allowed, how long users have to request one, which purchases can be refunded, and important restrictions.',
  },
  'pricing/free-access/free-characters': {
    whatItMeasures: 'Checks how many characters users can access or create without paying.',
    howWeTested: 'We checked how many ready-made characters can be opened by a free user. We also check whether free users can create their own characters.',
  },
  'pricing/free-access/free-chat': {
    whatItMeasures: 'Checks how much users can chat without paying.',
    howWeTested: 'We created a free account and start a normal conversation. We continue sending messages until the app blocks the chat or asks for payment.',
  },
  'pricing/free-access/free-images': {
    whatItMeasures: 'Checks how many images can be created for free.',
    howWeTested: 'We tried to create images through every image tool available to free users. We continue until the allowance ends or the app asks for payment.',
  },
  'pricing/free-access/free-trial': {
    whatItMeasures: 'Estimates how much the free access would cost if the same usage were paid.',
    howWeTested: 'We created a new account and check whether useful features are available, whether a credit card is required, whether the free offer is only a short trial, and whether the trial automatically becomes paid.',
  },
  'pricing/free-access/free-value': {
    whatItMeasures: 'Estimates how much the free access would cost if the same usage were paid.',
    howWeTested: 'We created a new account and check whether useful features are available, whether a credit card is required, whether the free offer is only a short trial, and whether the trial automatically becomes paid.',
  },
  'pricing/free-access/free-video': {
    whatItMeasures: 'Checks whether users can create videos without paying.',
    howWeTested: 'We tried to generate videos through every video option available to free users. We wrote down how many successful videos can be created.',
  },
  'pricing/free-access/free-voice': {
    whatItMeasures: 'Checks whether voice messages or calls can be tested for free.',
    howWeTested: 'We used the available free voice features until the allowance runs out. We wrote down the total amount of free voice time in seconds.',
  },
  'pricing/free-access/restrictions': {
    whatItMeasures: 'Checks what limits make the free version less useful.',
    howWeTested: 'We checked the app, pricing page, account balance, and terms. We wrote down when free access resets, whether free credits expire, how long a free trial lasts, whether payment details are required, and whether some features are completely blocked.',
  },
  'pricing/plan-value/annual-discount': {
    whatItMeasures: 'Checks how much cheaper the annual plan is than paying monthly for a full year.',
    howWeTested: 'We compared the monthly price multiplied by 12 with the full annual price. Annual discount equals the amount saved divided by the normal yearly monthly cost, multiplied by 100.',
  },
  'pricing/plan-value/annual-price': {
    whatItMeasures: 'Checks the total cost of paying for one year.',
    howWeTested: 'We wrote down the full annual payment and divide it by 12. For example, a $96 annual payment equals $8 per month.',
  },
  'pricing/plan-value/included-credits': {
    whatItMeasures: 'Checks how many credits or tokens come with the subscription and what they can actually buy.',
    howWeTested: 'We wrote down credits included at signup, credits added each billing period, whether unused credits carry over, which features use credits, and whether different plans receive different amounts.',
  },
  'pricing/plan-value/included-features': {
    whatItMeasures: 'Checks which important features are included in the subscription without another payment.',
    howWeTested: 'We checked whether the selected plan includes standard chat, character library, character creation, image generation, image editing, video generation, voice messages, voice calls, memory controls, and message regeneration. A feature counts as included when users can access it without buying another subscription.',
  },
  'pricing/plan-value/monthly-price': {
    whatItMeasures: 'Checks the normal cost of paying month by month.',
    howWeTested: 'We checked the pricing page and checkout screen. We wrote down the monthly subscription price, currency, required taxes or fees when clearly shown, and whether the price is temporary or introductory.',
  },
  'pricing/plan-value/plan-limits': {
    whatItMeasures: 'Checks the main limits placed on the subscription.',
    howWeTested: 'We wrote down the exact limits for messages, images, videos, voice messages, voice calls, and created characters.',
  },
  'pricing/usage-costs/call-cost': {
    whatItMeasures: 'Checks the price of one minute of AI phone calls.',
    howWeTested: 'We wrote down how many credits one minute of calling uses, then calculate the dollar value of those credits using the cheapest credit package available to normal users. For example, 20 credits at $0.05 each equals $1 per minute.',
  },
  'pricing/usage-costs/image-cost': {
    whatItMeasures: 'Checks the average price of creating one image.',
    howWeTested: 'First, we record how many credits one standard image costs. We then calculate the dollar value of those credits using the cheapest credit package available to normal users.',
  },
  'pricing/usage-costs/monthly-spend': {
    whatItMeasures: 'Estimates what a real user may spend in one month after subscription and usage costs.',
    howWeTested: 'We calculate the cost of the required subscription, 500 chat messages, 20 images, 4 videos, 30 minutes of voice use, required credit top-ups, and required payment fees. We begin with the monthly subscription, then calculate whether included credits cover this regular-use example.',
  },
  'pricing/usage-costs/top-up-value': {
    whatItMeasures: 'Checks how much real use users receive when buying extra credits.',
    howWeTested: 'For each package, we record the package price, number of credits, and cost per credit using package price divided by included credits.',
  },
  'pricing/usage-costs/video-cost': {
    whatItMeasures: 'Checks the price of generating ten seconds of video.',
    howWeTested: 'We calculate the cost of the standard video length offered by the app, then change the result into a cost per 10 seconds. A 5-second video at $1.20 becomes $2.40 per 10 seconds.',
  },
  'pricing/usage-costs/voice-cost': {
    whatItMeasures: 'Checks the price of generating ten seconds of voice.',
    howWeTested: 'We wrote down how many credits one voice message costs, how long the voice message is, and the dollar value of the credits. We then calculate the cost per 10 seconds.',
  },
  'privacy/data-use/advertising': {
    whatItMeasures: 'Checks whether personal data is used for advertising or ad targeting.',
    howWeTested: 'We checked the privacy policy and account settings for wording about advertising, personalized ads, marketing profiles, tracking, behavioral advertising, and selling or sharing data for ads.',
  },
  'privacy/data-use/data-sharing': {
    whatItMeasures: 'Checks whether personal data is shared with other companies.',
    howWeTested: 'We reviewed the list of third parties or groups of companies that may receive user data. We wrote down whether sharing happens, why the data is shared, which types of companies receive it, and how many third-party categories are listed.',
  },
  'privacy/data-use/human-review': {
    whatItMeasures: 'Checks whether employees or contractors may read chats or review uploaded content.',
    howWeTested: 'We searched the privacy policy, terms, and help pages for wording about employees reading chats, contractors reviewing content, safety reviews, support access, quality checks, and moderation.',
  },
  'privacy/data-use/policy-clarity': {
    whatItMeasures: 'Checks how clearly the company explains its privacy practices.',
    howWeTested: 'We checked whether the company clearly answers these six questions: Are chats used for AI training? Can people read chats?',
  },
  'privacy/data-use/retention': {
    whatItMeasures: 'Checks how long chats and personal data may be kept.',
    howWeTested: 'We wrote down the stated storage period for chats, account information, payment information, and deleted data. We used the exact time given by the company, such as days, months, or years.',
  },
  'privacy/data-use/training': {
    whatItMeasures: 'Checks whether user data or conversations may be used to train AI systems.',
    howWeTested: 'We searched the privacy policy, terms of service, help pages, and account settings. We look for clear wording about AI training, model improvement, product improvement, and similar uses.',
  },
  'privacy/security/billing-descriptor': {
    whatItMeasures: 'Checks what name appears on the user’s bank or card statement.',
    howWeTested: 'Before completing payment, we check the checkout page, payment information, billing help pages, and subscription FAQs. We look for the exact billing name or a clear example of the name users should expect.',
  },
  'privacy/security/encryption': {
    whatItMeasures: 'Checks whether data is protected while being sent and while stored.',
    howWeTested: 'We searched official sources, including the privacy policy, security pages, help center, terms of service, and official company statements. We wrote down how many of the three encryption types the company clearly confirms.',
  },
  'privacy/security/security-incidents': {
    whatItMeasures: 'Checks whether the company has had known data leaks, hacks, or other serious security problems.',
    howWeTested: 'We searched for incidents from the five years before the review date. We look for data breaches, exposed databases, leaked chats or media, unauthorized account access, security failures confirmed by an authority, and other incidents that exposed user information.',
  },
  'privacy/security/two-factor-authentication': {
    whatItMeasures: 'Checks whether accounts can be protected with a second login step.',
    howWeTested: 'We opened the paid test account’s security settings and try to enable two-factor authentication. We wrote down whether the feature exists, whether setup works, which method is supported, and whether important restrictions apply.',
  },
  'privacy/support/support-available': {
    whatItMeasures: 'Shows whether the company offers customer support.',
    howWeTested: 'We checked the app, website, help center, account settings, footer, and legal pages.',
  },
  'privacy/support/support-channels': {
    whatItMeasures: 'Shows how users can contact support, such as email, live chat, or a help form.',
    howWeTested: 'We save any official support email, contact page, contact form, live-chat link, Discord link, Reddit link, or Telegram link.',
  },
  'privacy/support/support-helpfulness': {
    whatItMeasures: 'Checks whether support gives a clear answer that actually solves the problem.',
    howWeTested: 'We checked whether the reply understood the question, gave useful information, provided clear instructions, solved the issue, or gave a clear next step.',
  },
  'privacy/support/support-reach': {
    whatItMeasures: 'Checks how easy it is to find and use the support contact options.',
    howWeTested: 'We checked how easy the support option is to find, whether the instructions are clear, whether the form or email works, whether unnecessary steps are required, and whether the request sends successfully.',
  },
  'privacy/support/support-speed': {
    whatItMeasures: 'Checks how long support takes to reply.',
    howWeTested: 'We sent one real request and wait for a reply.',
  },
  'privacy/user-control/delete-account': {
    whatItMeasures: 'Checks whether users can permanently close their account.',
    howWeTested: 'We opened the test account’s settings and look for an account-deletion option. We counted every required step from opening the settings to reaching the deletion request or final confirmation.',
  },
  'privacy/user-control/delete-chats': {
    whatItMeasures: 'Checks whether users can remove individual chats or their full chat history.',
    howWeTested: 'We created three separate chats. We tried to delete each conversation through the normal controls available to users.',
  },
  'privacy/user-control/delete-personal-data': {
    whatItMeasures: 'Checks whether users can request the removal of personal data held by the company.',
    howWeTested: 'We reviewed the privacy policy, account settings, help pages, and data-request instructions. We checked whether users can request deletion of stored personal information beyond the content they can remove themselves.',
  },
  'privacy/user-control/export-data': {
    whatItMeasures: 'Checks whether users can download a copy of their personal data.',
    howWeTested: 'We requested an export of the paid test account’s data. We wrote down how the export is requested, whether support is required, when the export arrives, what file formats are included, and whether important account information is present.',
  },
  'privacy/user-control/training-opt-out': {
    whatItMeasures: 'Checks whether users can stop their data from being used for AI training.',
    howWeTested: 'We checked the account settings, privacy settings, privacy policy, help pages, and training or model-improvement controls. We look for a clear option or request process that lets users opt out.',
  },
  'video/capabilities/audio': {
    whatItMeasures: 'Checks whether generated videos can include sound, speech, or music.',
    howWeTested: 'We generated three videos and request audio. Across the tests, we check for speech, sound effects, and music.',
  },
  'video/capabilities/chat-video': {
    whatItMeasures: 'Checks whether videos can be requested and received inside the chat.',
    howWeTested: 'We requested one video in three separate chats. We checked whether the video is created and appears inside the conversation.',
  },
  'video/capabilities/image-to-video': {
    whatItMeasures: 'Checks whether a still image can be turned into a moving video.',
    howWeTested: 'We uploaded three different source images. We tried to create one video from each image and record whether every attempt works.',
  },
  'video/capabilities/maximum-length': {
    whatItMeasures: 'Checks the longest video the platform allows you to create.',
    howWeTested: 'We wrote down the longest selectable video length. We then generate one video using that setting to confirm the full length actually works.',
  },
  'video/capabilities/maximum-resolution': {
    whatItMeasures: 'Checks the highest video resolution available.',
    howWeTested: 'We generated a video using the highest-quality setting available. We downloaded the finished file and record its exact width and height in pixels.',
  },
  'video/capabilities/text-to-video': {
    whatItMeasures: 'Checks whether a video can be created directly from a written prompt.',
    howWeTested: 'We entered three different video prompts. Each test starts with text only.',
  },
  'video/experience/ease-of-use': {
    whatItMeasures: 'Checks how easy the video generator feels to use.',
    howWeTested: 'We created three videos and rated how easy the workflow felt from opening the generator to starting generation (1 = very hard, 10 = very easy).',
  },
  'video/experience/failures': {
    whatItMeasures: 'Checks how often video generation fails or returns a broken result.',
    howWeTested: 'We wrote down the result of 10 video-generation attempts. An attempt is marked as failed when it shows an error, remains stuck, produces no video, or produces a completely unusable result.',
  },
  'video/experience/regeneration': {
    whatItMeasures: 'Checks whether you can easily try again when a video result is poor.',
    howWeTested: 'We created three finished videos. We then try to regenerate each one through the normal controls.',
  },
  'video/experience/speed': {
    whatItMeasures: 'Checks how long it takes to generate a video.',
    howWeTested: 'We timed 10 video generations. The timer starts when we submit the generation and stops when the finished video is available.',
  },
  'video/quality/accuracy': {
    whatItMeasures: 'Checks whether the video follows the requested action and scene.',
    howWeTested: 'We generated 5 videos from prompts with five clear instructions and checked how many important parts each video followed.',
  },
  'video/quality/character-consistency': {
    whatItMeasures: 'Checks whether the character keeps the same identity throughout the video.',
    howWeTested: 'We generated 5 videos and checked each one from start to finish for changes to the face, hair, body, clothing, and other key details.',
  },
  'video/quality/frame-consistency': {
    whatItMeasures: 'Checks whether the video stays stable from one frame to the next.',
    howWeTested: 'We generated 5 videos and checked each one for flickering, warping, changing clothes or objects, and sudden background changes.',
  },
  'video/quality/motion': {
    whatItMeasures: 'Checks whether movement looks smooth, natural, and believable.',
    howWeTested: 'We generated 5 videos and checked each one for natural body, face, hand, and camera movement, plus believable physics.',
  },
  'video/quality/visual-errors': {
    whatItMeasures: 'Checks for obvious problems such as warped faces, broken limbs, melting objects, or sudden changes.',
    howWeTested: 'We generated 5 videos and checked each one for broken faces, damaged hands, extra or missing body parts, impossible movement, and major background problems.',
  },
};

const EVIDENCE_SLUG_ALIASES: Record<string, string> = {
  'customization/appearance/creator-personalities': 'customization/appearance/personality-presets',
  'chat-features/platform-extras/platform-extras-list': 'chat-features/platform-extras/other-extras',
  'video/quality/prompt-accuracy': 'video/quality/accuracy',
  'privacy/support/ease-of-contact': 'privacy/support/support-reach',
  'privacy/support/response-speed': 'privacy/support/support-speed',
  'privacy/support/helpfulness': 'privacy/support/support-helpfulness',
  'pricing/free-access/free-trial': 'pricing/free-access/free-value',
};

export function getSubscoreMethodology(
  categorySlug: string,
  subscoreSlug: string,
): SubscoreMethodologyCopy | undefined {
  return SUBSCORE_METHODOLOGY[`${categorySlug}/${subscoreSlug}`];
}

export function getEvidenceMethodology(
  categorySlug: string,
  subscoreSlug: string,
  evidenceSlug: string,
): EvidenceMethodologyCopy | undefined {
  if (!categorySlug || !subscoreSlug || !evidenceSlug) return undefined;
  const key = `${categorySlug}/${subscoreSlug}/${evidenceSlug}`;
  const resolved = EVIDENCE_SLUG_ALIASES[key] ?? key;
  return EVIDENCE_METHODOLOGY[resolved];
}
