export interface Referral {
  id: string;
  doctorName: string;
  patientName: string;
  department: string;
  bedLocation?: string;
  requestedTests?: string;
  doctorNote?: string;
  diagnosis?: string;
  complaints?: string;
  emergencyComment?: string;
  status:
    | "აქტიური"
    | "მოვიდეს - დადასტურებულია"
    | "განხილვაშია - იხილეთ კომენტარი"
    | "მოვიდა - დასრულებულია"
    | "უარყოფილია";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type StatusFilter =
  | "ყველა"
  | "აქტიური"
  | "მოვიდეს - დადასტურებულია"
  | "განხილვაშია - იხილეთ კომენტარი"
  | "მოვიდა - დასრულებულია"
  | "უარყოფილია";
