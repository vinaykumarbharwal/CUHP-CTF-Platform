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
      'Logic Challenge: Complete the pattern: One, Two, Three, Four, ?. Submit the answer as a flag.',
    category: 'Misc',
    difficulty: 'Easy',
    points: 100,
    flag: 'CUHP{Five}',
    hint: 'The sequence is based on counting words.'
  },
  {
    title: 'String Hunter',
    description:
      'Binary/Reverse Warmup: Find the valid flag hidden inside this noisy string: XX91__CUHP{s0m3th1ng_l1k3_th1s}__AB77. Submit the exact flag only.',
    category: 'Forensic',
    difficulty: 'Easy',
    points: 120,
    flag: 'CUHP{s0m3th1ng_l1k3_th1s}',
    hint: 'Flags in this platform always start with CUHP{ and end with }.'
  },
  {
    title: 'Old Is Gold',
    description:
      'Crypto Challenge: Decode the following Base64 text: Q1VIUHtCYXNlNjRfRW5jb2RlZH0=',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 100,
    flag: 'CUHP{Base64_Encoded}',
    hint: 'Use a Base64 decoder.'
  },
  {
    title: 'Upgraded Gold',
    description:
      'Crypto Challenge: Another Base64 warmup. Decode this value: Q1VIUHtCYXNlNjRfVXBncmFkZWQhfQ==',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 120,
    flag: 'CUHP{Base64_Upgraded!}',
    hint: 'This is also standard Base64.'
  },
  {
    title: 'Secret Shifts',
    description:
      'Crypto Challenge: Decode this ROT13 message: PHUC{E0G_1F_TbNG}',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 110,
    flag: 'CUHP{R0T_1S_GoAT}',
    hint: 'ROT13 shifts letters by 13.'
  },
  {
    title: 'Byte Sequence',
    description:
      'Crypto Challenge: Decode this hex string to text: 435548507b4833585f31535f4433434f4433447d',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 110,
    flag: 'CUHP{H3X_1S_D3COD3D}',
    hint: 'Each two hex characters represent one byte.'
  },
  {
    title: 'Morse Code Breaker',
    description:
      'Crypto Challenge: Decode this Morse code: -.-. ..- .... .--. --..-- -.-. .-. .- -.-. -.- . -.. --..-- -- --- .-. ... . --..-- -.-. --- -.. .',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 120,
    flag: 'CUHP{CRACKED_MORSE_CODE}',
    hint: 'Use a Morse decoder and format the final answer as the flag shown in challenge logic.'
  },
  {
    title: 'CrackMe Basic',
    description:
      'Reverse Warmup: The password checker compares input with this string in binary: simple_crackme_done. Submit the matching flag.',
    category: 'Binary',
    difficulty: 'Easy',
    points: 130,
    flag: 'CUHP{simple_crackme_done}',
    hint: 'Static strings in binaries are often the key.'
  },
  {
    title: 'Login Bypass',
    description:
      'Web Challenge: Basic login filter can be bypassed with simple SQLi payloads. Submit the known success flag.',
    category: 'Web',
    difficulty: 'Easy',
    points: 120,
    flag: 'CUHP{SQLI_BYPASS_SUCCESS}',
    hint: 'Think of classic username payloads using OR conditions.'
  },
  {
    title: 'Open Redirect',
    description:
      'Web Challenge: A redirect endpoint trusts user input and can be abused. Find and submit the flag.',
    category: 'Web',
    difficulty: 'Easy',
    points: 110,
    flag: 'CUHP{redirected_successfully}',
    hint: 'Inspect URL parameters controlling destination URLs.'
  },
  {
    title: 'Most Famous Hacker',
    description:
      'OSINT Challenge: Identify the hacker known as The Condor and submit the flag with lowercase name.',
    category: 'OSINT',
    difficulty: 'Easy',
    points: 90,
    flag: 'CUHP{kevin_mitnick}',
    hint: 'This is a well-known figure in hacking history.'
  },
  {
    title: 'Metadata Leak',
    description:
      'OSINT/Forensics Challenge: A file leaked hidden EXIF comment text containing the flag. Submit the leaked flag.',
    category: 'OSINT',
    difficulty: 'Easy',
    points: 100,
    flag: 'CUHP{meta_data_exposed}',
    hint: 'Use metadata viewers for images or documents.'
  },
  {
    title: 'Modu Dodu',
    description:
      'Misc Challenge: Rearrange and normalize this noisy text into uppercase letters only: h3ll0_h4ck3r. Submit the final clean flag.',
    category: 'Misc',
    difficulty: 'Easy',
    points: 100,
    flag: 'CUHP{HELLOHACKER}',
    hint: 'Remove symbols and convert number substitutions to letters.'
  },
  {
    title: 'Final Destination',
    description:
      'Misc Challenge: Final warmup. Recover the phrase from this text: HACKER_IS_ALWAYS_A_HACKER and submit as flag.',
    category: 'Misc',
    difficulty: 'Easy',
    points: 90,
    flag: 'CUHP{HACKER_IS_ALWAYS_A_HACKER!}',
    hint: 'Pay attention to punctuation in the final flag.'
  },
  {
    title: 'Hidden Archive',
    description:
      'Forensics Challenge: A zip file contains another zip file, and the inner archive contains the flag text.',
    category: 'Forensic',
    difficulty: 'Easy',
    points: 120,
    flag: 'CUHP{zip_inside_zip}',
    hint: 'Try extracting recursively.'
  }
];

module.exports = challenges;
