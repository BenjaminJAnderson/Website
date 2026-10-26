import raw from "./cv.json";

export interface CvContact {
  label: string;
  value: string;
  href?: string;
}

export interface CvProject {
  title: string;
  description: string;
  tags: string[];
  href?: string;
}

export interface CvExperience {
  date: string;
  title: string;
  organisation: string;
  organisationHref?: string;
  bullets: string[];
}

export interface CvEducation {
  date: string;
  title: string;
  institution: string;
  details: string[];
}

export interface CvData {
  name: string;
  role: string;
  contact: CvContact[];
  projects: CvProject[];
  experience: CvExperience[];
  volunteering: CvExperience[];
  education: CvEducation[];
  references: string;
}

export const cv = raw as CvData;
