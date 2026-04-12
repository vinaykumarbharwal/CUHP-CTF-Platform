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
  }
];

module.exports = challenges;
