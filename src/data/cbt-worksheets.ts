// Worksheet content for each CBT tool — structure, prompts, and cautions are
// adapted from publicly published clinical sources, kept in plain, gentle
// language for self-guided use:
//
//  • Hot Cross Bun / five-areas model — Padesky & Greenberger's "Mind Over
//    Mood" CBT formulation, as taught in NHS CBT self-help resources
//  • Downward Arrow — Aaron T. Beck's technique for tracing an automatic
//    thought down to the core belief beneath it (Beck Institute; guidance on
//    pacing and emotional sensitivity per Therapist Aid's clinician guide)
//  • Cognitive distortions — David Burns' ten thinking-trap taxonomy from
//    "Feeling Good: The New Mood Therapy", the list most CBT thought-record
//    worksheets (incl. Beck Institute / Psychology Tools materials) draw on
//  • Evidence Log — the "examining the evidence" / considered-response column
//    of Beck's standard CBT thought record (Beck Institute Thought Record
//    Worksheet; Psychology Tools "Thought Record")

export interface WorksheetStep {
  id: string;
  title: string;
  prompt: string;
  placeholder?: string;
  helper?: string;
}

export interface Distortion {
  id: string;
  name: string;
  definition: string;
  example: string;
}

export interface CbtWorksheet {
  toolId: string;
  overview: string;
  source: string;
  cautions: string[];
  intro: string;
  steps: WorksheetStep[];
  closing: string;
}

export const COGNITIVE_DISTORTIONS: Distortion[] = [
  {
    id: 'all-or-nothing',
    name: 'All-or-nothing thinking',
    definition: 'Seeing a situation in only two categories — perfect or a failure — with no middle ground.',
    example: '"If I don\'t do this perfectly, I\'ve completely failed."',
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    definition: 'Treating a single event as proof of a never-ending pattern, often signalled by "always" or "never".',
    example: '"I got it wrong this time — I always mess things up."',
  },
  {
    id: 'mental-filter',
    name: 'Mental filter',
    definition: 'Zeroing in on one negative detail so vividly that it colours everything else.',
    example: 'Replaying the one critical comment from a mostly warm conversation.',
  },
  {
    id: 'discounting-positive',
    name: 'Discounting the positive',
    definition: 'Telling yourself that good things — your efforts, qualities, or wins — "don\'t count" for some reason.',
    example: '"They were just being polite — it doesn\'t mean my work was actually good."',
  },
  {
    id: 'jumping-to-conclusions',
    name: 'Jumping to conclusions',
    definition: 'Assuming you know what someone else is thinking (mind-reading), or predicting things will turn out badly (fortune-telling) — without real evidence.',
    example: '"She didn\'t reply — she must be annoyed with me." / "This is going to go horribly."',
  },
  {
    id: 'magnification-minimization',
    name: 'Magnification & minimization',
    definition: 'Blowing the size or importance of something up — or shrinking it down — out of proportion to the facts.',
    example: '"This mistake is a disaster" — or — "My getting through that was nothing, anyone could do it."',
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional reasoning',
    definition: 'Treating a feeling as if it were proof of fact: "I feel it, so it must be true."',
    example: '"I feel like a fraud, so I must actually be one."',
  },
  {
    id: 'should-statements',
    name: '"Should" statements',
    definition: 'Holding yourself or others to rigid rules with "should", "must", or "ought to" — and feeling guilt or resentment when reality doesn\'t comply.',
    example: '"I should be over this by now."',
  },
  {
    id: 'labeling',
    name: 'Labeling',
    definition: 'Attaching one sweeping, global label to yourself or someone else instead of describing the specific thing that happened.',
    example: '"I made a mistake" becomes "I\'m an idiot."',
  },
  {
    id: 'personalization-blame',
    name: 'Personalization & blame',
    definition: 'Taking on responsibility for something that wasn\'t entirely within your control — or, conversely, placing all the blame elsewhere and overlooking your own part.',
    example: '"The project slipped — that\'s entirely on me," when several things outside your control contributed.',
  },
];

export const CBT_WORKSHEETS: Record<string, CbtWorksheet> = {
  'hot-cross-bun': {
    toolId: 'hot-cross-bun',
    overview:
      'The "hot cross bun" (or five-areas) model separates a single moment into four linked parts — thoughts, feelings, physical sensations, and behaviors — sitting around the situation that triggered them. Seeing the four written out side by side often reveals how each one feeds the others, and where there might be room to step in.',
    source: 'Adapted from the five-areas CBT formulation (Padesky & Greenberger, "Mind Over Mood"), as commonly taught in NHS CBT self-help resources.',
    cautions: [
      'Pick a moment that still feels reasonably manageable to revisit — not the heaviest one you\'re carrying right now. You can always come back to harder moments later, ideally alongside a therapist.',
      'There\'s no "correct" set of answers. The aim is to notice connections, not to judge what you find.',
    ],
    intro: 'Bring to mind one specific recent moment that stirred something in you — a conversation, a notification, a passing thought. Something small and recent tends to work better than something huge.',
    steps: [
      {
        id: 'situation',
        title: 'The situation',
        prompt: 'In a sentence or two, what happened? Stick to the facts — who, what, where — rather than the interpretation of it.',
        placeholder: 'e.g. "My manager asked to reschedule our 1:1 for the third time this month."',
      },
      {
        id: 'thoughts',
        title: 'Thoughts',
        prompt: 'What went through your mind in that moment? Write down the actual words or images, even if they feel unfair or extreme.',
        placeholder: 'e.g. "She\'s avoiding me. I must be doing something wrong."',
        helper: 'Thoughts are the running commentary — the interpretations, predictions, or judgments your mind offered up.',
      },
      {
        id: 'feelings',
        title: 'Feelings',
        prompt: 'Name the emotions that showed up. One word each is plenty — and it\'s normal for more than one to be present at once.',
        placeholder: 'e.g. "Anxious, a little hurt, embarrassed."',
        helper: 'Feelings are emotions — distinct from thoughts (interpretations) and from physical sensations (body states).',
      },
      {
        id: 'physical',
        title: 'Physical sensations',
        prompt: 'What did you notice in your body? Tight chest, racing heart, heavy limbs, a knot in your stomach — whatever was there.',
        placeholder: 'e.g. "Shoulders tensed up, stomach dropped."',
      },
      {
        id: 'behaviors',
        title: 'Behaviors',
        prompt: 'What did you do — or what did you feel the urge to do — in response? Include things you avoided, too.',
        placeholder: 'e.g. "Said it was fine, then reread the message six times after."',
      },
    ],
    closing: 'Look back over what you\'ve written. Often a thought intensifies a feeling, the feeling shows up in the body, and the body pushes toward a behavior — which can loop back and reinforce the original thought. Where in this loop do you feel like you have the most room to do something differently, even slightly?',
  },

  'downward-arrow': {
    toolId: 'downward-arrow',
    overview:
      'The downward arrow technique follows a surface-level thought down through a chain of "if that were true, what would it mean?" questions, layer by layer, until it reaches a simpler, more deeply-held belief underneath. Seeing that belief named plainly is often the first step toward gently questioning it.',
    source: 'Adapted from Aaron T. Beck\'s downward arrow technique for uncovering core beliefs (Beck Institute for Cognitive Behavior Therapy); pacing guidance informed by Therapist Aid\'s clinician walkthrough of the method.',
    cautions: [
      'This technique is built to surface deeper, more emotionally-charged material than a typical thought record — that\'s the point of it, but it can bring up strong feelings as you go. That\'s a normal and even useful sign, not something going wrong.',
      'You\'re always allowed to stop partway. A chain that goes three layers deep is still genuinely useful — you don\'t have to chase it all the way to the bottom in one sitting.',
      'If what surfaces feels heavier than expected, consider working through it with a therapist, who can help hold and explore it safely alongside you.',
    ],
    intro: 'Start with one thought that\'s been sitting with you — something specific and recent tends to open up more easily than something broad like "I\'m a failure" stated outright.',
    steps: [
      {
        id: 'thought',
        title: 'The starting thought',
        prompt: 'What\'s the thought you want to follow? Write it as it actually crossed your mind.',
        placeholder: 'e.g. "I froze up answering that question in the meeting."',
      },
      {
        id: 'layer-1',
        title: 'One layer down',
        prompt: 'If that were true — what would it mean to you? What\'s the worry underneath it?',
        placeholder: 'e.g. "It would mean people there think I\'m out of my depth."',
        helper: 'Try to follow the meaning, not the details of the situation — "what would that say about me / my life / my future?"',
      },
      {
        id: 'layer-2',
        title: 'Another layer down',
        prompt: 'And if that were true too — what would that mean? Keep gently asking "...and what would that mean about me?"',
        placeholder: 'e.g. "That I\'ve been getting away with not really being good enough."',
      },
      {
        id: 'layer-3',
        title: 'As deep as feels right',
        prompt: 'One more layer, only if it feels right to keep going. What\'s the simplest version of the belief sitting at the bottom of this chain?',
        placeholder: 'e.g. "I\'m not good enough."',
        helper: 'Core beliefs tend to be short, absolute, and old — often something you\'ve quietly carried for a long time.',
      },
    ],
    closing: 'Whatever you landed on — read it back slowly, as if a close friend had written it about themselves. Beliefs like this are usually old, learned early, and rarely the full picture. Naming it plainly, like you just did, is itself the hard and useful part. What\'s one piece of your own history that doesn\'t fit neatly into that belief?',
  },

  'distortion-check': {
    toolId: 'distortion-check',
    overview:
      'Thinking traps (cognitive distortions) are familiar patterns minds slip into under stress — small twists that make a thought feel more certain or more catastrophic than the situation actually supports. Naming the pattern in a thought is often enough to loosen its grip a little.',
    source: 'Cognitive distortion taxonomy adapted from David Burns, "Feeling Good: The New Mood Therapy" — the ten-pattern list that underlies most CBT thought-record worksheets, including those published by the Beck Institute and Psychology Tools.',
    cautions: [
      'Spotting a distortion doesn\'t mean the thought — or the feeling behind it — is silly or invalid. It means the mind reached for a familiar shortcut under pressure, the way every mind does.',
      'It\'s common for a thought to carry more than one pattern at once, and just as common for it to carry none. Both are useful things to notice.',
    ],
    intro: 'Bring back a thought that\'s been weighing on you — ideally one that felt very certain or very final in the moment.',
    steps: [
      {
        id: 'thought',
        title: 'The thought',
        prompt: 'Write the thought down exactly as it occurred to you — first-person, present tense, in your own words.',
        placeholder: 'e.g. "Nobody actually wants me there, they\'re just being polite."',
      },
      {
        id: 'distortions',
        title: 'Which patterns fit?',
        prompt: 'Read through the list below. Tap any thinking traps that seem to genuinely show up in this thought — there\'s no required number.',
        helper: 'Take your time with each one. If none feel like a fit, that\'s a perfectly fine answer too.',
      },
      {
        id: 'reflection',
        title: 'Looking again',
        prompt: 'Now that you can see the pattern(s) at play, does the thought feel quite as certain as it did at first? What might a slightly more even-handed version of it sound like?',
        placeholder: 'e.g. "Maybe some people are just quieter, and that doesn\'t mean they don\'t want me there."',
      },
    ],
    closing: 'You\'ve just done something a lot of CBT work centers on: catching a thought mid-flight and looking at its shape rather than just its content. That gap — between having a thought and automatically believing it — is exactly where change tends to start.',
  },

  'evidence-log': {
    toolId: 'evidence-log',
    overview:
      'This is the "examining the evidence" step from a classic CBT thought record — laying out, side by side, what genuinely supports a belief and what complicates or contradicts it, like weighing two columns rather than taking the belief\'s word for it.',
    source: 'Adapted from the evidence-for/evidence-against columns of Beck\'s standard CBT thought record (Beck Institute for Cognitive Behavior Therapy Thought Record Worksheet; Psychology Tools "Thought Record — Universal").',
    cautions: [
      'Be as rigorous with the "for" column as the "against" one — the goal isn\'t to argue yourself out of how you feel, it\'s to see the fuller picture clearly.',
      '"Evidence" means observable facts and events — not other feelings or assumptions restated. "I felt embarrassed" is a feeling; "they changed the subject" is evidence.',
    ],
    intro: 'Pick a belief that\'s felt heavy or sticky lately — something you find yourself returning to, that feels more like a verdict than a thought.',
    steps: [
      {
        id: 'belief',
        title: 'The belief',
        prompt: 'State the belief plainly, the way it shows up in your mind.',
        placeholder: 'e.g. "I always let people down eventually."',
      },
      {
        id: 'for',
        title: 'Evidence that supports it',
        prompt: 'What real events or facts seem to back this belief up? List what you can, even if it feels uncomfortable to write down.',
        placeholder: 'e.g. "I cancelled on Sam last month when I was overwhelmed."',
        helper: 'Stick to things that actually happened — specific moments, not general impressions.',
      },
      {
        id: 'against',
        title: 'Evidence that complicates it',
        prompt: 'Now the harder column: what facts sit alongside that belief without fitting neatly into it? Times you came through, were forgiven, or where the full story was more complicated than the belief allows.',
        placeholder: 'e.g. "Sam told me they appreciated that I was honest about needing space."',
      },
      {
        id: 'balanced',
        title: 'A more balanced view',
        prompt: 'Holding both columns at once — what\'s a statement that\'s fair to all of this evidence, rather than to just one side of it?',
        placeholder: 'e.g. "I\'ve let people down sometimes, especially when I\'m stretched thin — and I\'ve also shown up for people in ways that matter."',
        helper: 'A balanced thought isn\'t a forced-positive one. It\'s simply one that the full evidence actually supports.',
      },
    ],
    closing: 'Beliefs that feel like verdicts often soften once they\'re actually weighed against the evidence rather than taken at their word. You don\'t have to fully believe the balanced version yet — just notice whether it sits a little more honestly than the original.',
  },

  'responsibility-pie': {
    toolId: 'responsibility-pie',
    overview:
      'When something goes wrong, the mind often defaults to placing the bulk of blame on one source — frequently yourself. The Responsibility Pie technique distributes accountability across all the real factors that contributed, then asks: what slice is actually yours? The answer is usually more accurate — and smaller — than the initial gut estimate.',
    source: 'Adapted from the Responsibility Pie technique as described in Judith S. Beck, "Cognitive Behavior Therapy: Basics and Beyond" (3rd ed., Guilford Press), and as implemented in standard CBT for personalization and over-responsibility cognitions.',
    cautions: [
      'The goal is accurate attribution, not zero responsibility. A fair slice — even a meaningful one — is still a fairer outcome than carrying the whole weight alone.',
      'Work through every other factor first before estimating your own share. This is the core of the technique: doing yourself last almost always results in a smaller, truer percentage.',
      'This technique is designed for situations where responsibility is genuinely shared or complex. It is not intended for use with events where harm was done to you — in those cases, please work with a therapist.',
    ],
    intro: 'Think of a situation where you ended up feeling responsible — or where you\'re still carrying the blame. Something where you caught yourself saying "that was my fault" or "I should have done something differently."',
    steps: [
      {
        id: 'situation',
        title: 'The situation',
        prompt: 'Briefly describe what happened and the outcome you feel responsible for.',
        placeholder: 'e.g. "The project launch was late and the client was frustrated — I keep thinking it was all on me."',
      },
      {
        id: 'gut-blame',
        title: 'Your gut estimate',
        prompt: 'Before examining anything — what percentage of the blame have you been putting on yourself? Just write the number, even if it feels too high.',
        placeholder: 'e.g. "About 80%."',
        helper: 'There\'s no wrong answer here — this is the starting point, not a verdict.',
      },
      {
        id: 'contributors',
        title: 'All the factors involved',
        prompt: 'Now slow down and list everyone and everything that played some role — other people, circumstance, timing, systems, information gaps, things outside anyone\'s control. Cast the net wide.',
        placeholder: 'e.g. "The scope changed late. A key team member was off sick. The client\'s internal review process ran long. Communication across teams was unclear."',
        helper: 'Include factors beyond people too: poor processes, unclear expectations, resource constraints, timing, chance. Everything that had any hand in the outcome.',
      },
      {
        id: 'percentages',
        title: 'Assign each factor a share',
        prompt: 'Go back through your list and assign each factor a rough percentage of responsibility. Tackle every other factor before you get to yourself — save your own slice for last.',
        placeholder: 'e.g. "Scope changes: 25%. Team member absence: 15%. Client delays: 20%. Communication issues: 20%. My part: ___"',
        helper: 'These don\'t need to add up perfectly — rough estimates are fine. The process of distributing responsibility is what matters, not the arithmetic.',
      },
      {
        id: 'your-slice',
        title: 'Your actual slice',
        prompt: 'After distributing to everything else — what\'s left for you? Write your final percentage and, if you like, what specifically within that is genuinely yours.',
        placeholder: 'e.g. "About 20% — specifically, I could have flagged the scope risk earlier and pushed harder for a clearer brief."',
      },
      {
        id: 'reflection',
        title: 'What do you notice?',
        prompt: 'Compare your initial gut estimate to the slice you landed on. What\'s the gap? Does anything shift when you see your part alongside everything else?',
        placeholder: 'e.g. "I started at 80% and ended at 20%. I knew the other stuff was there — I just wasn\'t counting it."',
        helper: 'Noticing the gap isn\'t about letting yourself off the hook — it\'s about carrying the weight that\'s actually yours, rather than everyone else\'s too.',
      },
    ],
    closing: 'Personalization — taking on more blame than the situation warrants — is one of the most common and quiet forms of distress. You can hold your real part of this, whatever it is, without needing to carry the whole thing. What would it feel like to put the rest down?',
  },
};

export function getCbtWorksheet(id: string | undefined): CbtWorksheet | undefined {
  return id ? CBT_WORKSHEETS[id] : undefined;
}
