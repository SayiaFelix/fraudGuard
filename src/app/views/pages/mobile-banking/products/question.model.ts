export interface Question {
    title: string;
    subQuestions: {
      label: string;
      value: boolean;
    }[];
    comment: string;
  }