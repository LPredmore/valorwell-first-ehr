export enum AppearanceEnum {
  Normal = "Normal Appearance & Grooming",
  Disheveled = "Disheveled",
  PoorHygiene = "Poor Hygiene",
  InappropriatelyDressed = "Inappropriately Dressed",
  Eccentric = "Eccentric Appearance",
  WellGroomedTense = "Well-Groomed but Tense",
  MeticulouslyGroomed = "Meticulously Groomed",
  AgeInappropriate = "Age-Inappropriate Appearance",
  UnusualAdornments = "Unusual Clothing or Adornments",
  AppearsAgeVariant = "Appears Older/Younger Than Stated Age",
}

export enum AttitudeEnum {
  CalmCooperative = "Calm & Cooperative",
  Uncooperative = "Uncooperative",
  Guarded = "Guarded",
  Suspicious = "Suspicious",
  Hostile = "Hostile",
  Defensive = "Defensive",
  Apathetic = "Apathetic",
  Evasive = "Evasive",
  Irritable = "Irritable",
  Engaging = "Engaging",
  Friendly = "Friendly",
  Withdrawn = "Withdrawn",
}

export enum BehaviorEnum {
  NoUnusual = "No unusual behavior or psychomotor changes",
  PsychomotorAgitation = "Psychomotor Agitation",
  PsychomotorRetardation = "Psychomotor Retardation",
  Restless = "Restlessness",
  Hyperactive = "Hyperactive",
  Compulsive = "Compulsive Behaviors",
  Catatonic = "Catatonic Features",
  Impulsive = "Impulsive",
  Disorganized = "Disorganized",
  Aggressive = "Aggressive",
  SociallyInappropriate = "Socially Inappropriate",
  Tremulous = "Tremulous",
}

export enum SpeechEnum {
  Normal = "Normal rate/tone/volume w/out pressure",
  Pressured = "Pressured Speech",
  Monotone = "Monotone",
  Loud = "Loud",
  SoftQuiet = "Soft/Quiet",
  Rapid = "Rapid",
  Slow = "Slow",
  Slurred = "Slurred",
  Mumbled = "Mumbled",
  Tangential = "Tangential",
  Circumstantial = "Circumstantial",
  Incoherent = "Incoherent",
  Poverty = "Poverty of Speech",
  Stuttering = "Stuttering"
}

export enum AffectEnum {
  Normal = "Normal range/congruent",
  Blunted = "Blunted",
  Flat = "Flat",
  Labile = "Labile",
  Constricted = "Constricted",
  Expansive = "Expansive",
  Incongruent = "Incongruent with Content",
  Inappropriate = "Inappropriate",
  Anxious = "Anxious",
  Dysphoric = "Dysphoric",
  Euphoric = "Euphoric",
  Irritable = "Irritable"
}

export enum ThoughtProcessEnum {
  GoalOriented = "Goal Oriented/Directed",
  Tangential = "Tangential",
  Circumstantial = "Circumstantial",
  FlightOfIdeas = "Flight of Ideas",
  LooseAssociations = "Loose Associations",
  Perseverative = "Perseverative",
  Blocking = "Blocking",
  Derailment = "Derailment",
  Concrete = "Concrete",
  Abstract = "Abstract",
  Poverty = "Poverty of Thought",
  Racing = "Racing Thoughts"
}

export enum PerceptionEnum {
  NoHallucinations = "No Hallucinations or Delusions",
  Auditory = "Auditory Hallucinations",
  Visual = "Visual Hallucinations",
  Tactile = "Tactile Hallucinations",
  Olfactory = "Olfactory Hallucinations",
  Gustatory = "Gustatory Hallucinations",
  Illusions = "Illusions",
  IdeasOfReference = "Ideas of Reference",
  Paranoid = "Paranoid Ideation",
  Grandiose = "Grandiose Ideation",
  Somatic = "Somatic Delusions",
  Derealization = "Derealization",
  Depersonalization = "Depersonalization"
}

export enum OrientationEnum {
  OrientedX3 = "Oriented x3",
  OrientedX2 = "Oriented x2",
  OrientedX1 = "Oriented x1",
  DisorientedPerson = "Disoriented to Person",
  DisorientedPlace = "Disoriented to Place",
  DisorientedTime = "Disoriented to Time",
  FullyDisoriented = "Fully Disoriented"
}

export enum MemoryConcentrationEnum {
  Intact = "Short & Long Term Intact",
  ShortImpaired = "Short-Term Memory Impaired",
  LongImpaired = "Long-Term Memory Impaired",
  BothImpaired = "Both Short and Long-Term Impaired",
  ConcentrationDifficulty = "Concentration Difficulty",
  EasilyDistracted = "Easily Distracted",
  UnableToFocus = "Unable to Focus",
  Confabulation = "Confabulation Present",
  Gaps = "Memory Gaps",
  Selective = "Selective Memory"
}

export enum InsightJudgementEnum {
  Good = "Good",
  Fair = "Fair",
  Poor = "Poor",
  Absent = "Absent",
  Limited = "Limited",
  Impaired = "Impaired",
  Inconsistent = "Inconsistent",
  Distorted = "Distorted",
  Developing = "Developing",
  Improved = "Improved"
}

/**
 * Centralized "Mood" options for Mental Status.
 * These follow most common clinical descriptions for mood.
 */
export enum MoodEnum {
  Euthymic = "Euthymic",
  Anxious = "Anxious",
  Depressed = "Depressed",
  Angry = "Angry",
  Irritable = "Irritable",
  Euphoric = "Euphoric",
  Labile = "Labile",
  Dysphoric = "Dysphoric",
  Flat = "Flat",
  Apathetic = "Apathetic",
  Fearful = "Fearful",
  Hopeful = "Hopeful",
  Guilty = "Guilty",
  Suspicious = "Suspicious",
  Other = "Other"
}
