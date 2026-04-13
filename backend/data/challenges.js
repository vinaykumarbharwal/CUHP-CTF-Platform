const challenges = [
  {
    title: 'Sample Challenge (How To Play)',
    description:
      'Welcome to CUHP CTF! This is a practice problem. To solve it: 1) Open this challenge. 2) Copy the flag from this description. 3) Submit it in the flag box. Flag: CUHP{sample_flag}',
    category: 'Misc',
    difficulty: 'Easy',
    points: 10,
    flag: 'CUHP{sample_flag}',
    hint: 'Format reminder: flags look like CUHP{...}. For this sample, submit CUHP{sample_flag} exactly.'
  },
  {
    title: 'SQL Injection 101',
    description: 'Try to bypass the login form using SQL injection. The login page is at /login.php',
    category: 'Web',
    difficulty: 'Easy',
    points: 100,
    flag: 'CUHP{sql_injection_is_fun}'
  },
  {
    title: 'Caesar Cipher',
    description: "Decrypt the following message: 'Fdhvdu fdhvdu'",
    category: 'Crypto',
    difficulty: 'Easy',
    points: 100,
    flag: 'CUHP{caesar_cipher_basics}'
  },
  {
    title: 'Buffer Overflow',
    description: 'Exploit the buffer overflow vulnerability in the provided binary',
    category: 'Binary',
    difficulty: 'Hard',
    points: 300,
    flag: 'CUHP{buffer_overflow_master}'
  },
  {
    title: 'Metadata Analysis',
    description: 'Analyze the metadata of the provided image to find the flag',
    category: 'OSINT',
    difficulty: 'Medium',
    points: 200,
    flag: 'CUHP{metadata_contains_secrets}'
  },
  {
    title: 'JWT Tampering',
    description: 'Modify the JWT token to escalate privileges',
    category: 'Misc',
    difficulty: 'Medium',
    points: 200,
    flag: 'CUHP{jwt_tampering_success}'
  },
  {
    title: 'Hidden in Pixels',
    description: 'An analyst found a strange image on a suspect\'s laptop. Can you uncover the secret hidden within its pixels?',
    category: 'Forensic',
    difficulty: 'Easy',
    points: 150,
    flag: 'CUHP{forensic_pixel_mystery}',
    hint: 'Digital images often contain more than just visual data. Check for hidden strings or hidden data blocks.'
  },
  {
    title: 'Forensic Sample: Network Trace',
    description: 'This is a sample forensics challenge. Often you will need to analyze network traffic files (.pcap). For this sample, just submit the flag: CUHP{pcap_analysis_entry}',
    category: 'Forensic',
    difficulty: 'Easy',
    points: 10,
    flag: 'CUHP{pcap_analysis_entry}',
    hint: 'Just copy the flag from the description for this sample challenge.'
  },
  {
    title: 'WhatsApp Whisper',
    description:
      'OSINT Challenge: A clue is hidden in a WhatsApp shared link. Open the link and inspect the visible metadata (group/channel name, about text, preview details, or linked profile clues). The flag is hidden in one of those public details. WhatsApp Link: REPLACE_WITH_WHATSAPP_LINK',
    category: 'OSINT',
    difficulty: 'Easy',
    points: 150,
    flag: 'CUHP{replace_with_whatsapp_whisper_flag}',
    hint: 'Carefully read all text shown in the preview and related public info. Do not brute-force; this is a reconnaissance task.'
  },
  {
    title: 'Social Stalker',
    description:
      'OSINT Challenge: Investigate the target social media account and inspect the specified post. Username: imgautii. Task: find the post clue and extract the exact flag from the caption text.',
    category: 'OSINT',
    difficulty: 'Medium',
    points: 200,
    flag: 'CUHP{replace_with_social_stalker_flag}',
    hint: 'The flag is in the caption of the intended post. Watch for exact casing, symbols, and braces.'
  },
  {
    title: 'Location Finder',
    description:
      'OSINT Challenge: Identify the exact place shown in the evidence image and submit the hidden flag. Evidence clue: a clock tower near a roundabout with a red-brick library in the background. Use map tools and image clues to triangulate the location.',
    category: 'OSINT',
    difficulty: 'Medium',
    points: 220,
    flag: 'CUHP{clocktower_roundabout_trace}',
    hint: 'Focus on unique landmarks, road signs, and architectural style. Narrow down city first, then specific coordinates.'
  },
  {
    title: 'What Comes Next',
    description:
      'Logic Challenge: Find the next value in this sequence and format it as the flag body: 2, 6, 12, 20, 30, ?. Submit as CUHP{next_value}.',
    category: 'Misc',
    difficulty: 'Easy',
    points: 120,
    flag: 'CUHP{42}',
    hint: 'Look at the difference between terms: +4, +6, +8, +10, ...'
  },
  {
    title: 'String Hunter',
    description:
      'Forensic Challenge: You recovered a suspicious text blob from memory. Extract the likely flag from this noisy string: xx7A9CUHP{str1ngs_c4n_t3ll_st0r13s}Q2pLm. Submit exactly what looks like the valid flag.',
    category: 'Forensic',
    difficulty: 'Easy',
    points: 140,
    flag: 'CUHP{str1ngs_c4n_t3ll_st0r13s}',
    hint: 'Flags in this platform always start with CUHP{ and end with }.'
  },
  {
    title: 'Old Is Gold',
    description:
      'Crypto Challenge: A classic Caesar cipher was used with shift 13. Decrypt this text: PHUC{byq_vf_tbyq}.',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 160,
    flag: 'CUHP{old_is_gold}',
    hint: 'ROT13 is Caesar shift 13 and is symmetric.'
  },
  {
    title: 'Upgraded Gold',
    description:
      'Crypto Challenge: The same phrase from Old Is Gold was upgraded using Base64. Decode this: Q1VIUHt1cGdyYWRlZF9nb2xkfQ==',
    category: 'Crypto',
    difficulty: 'Medium',
    points: 240,
    flag: 'CUHP{upgraded_gold}',
    hint: 'The encoded text uses a common ASCII-safe encoding often ending in =.'
  }
];

module.exports = challenges;
