import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  FolderOpen,
  Globe,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  User,
  AlertCircle,
} from "lucide-react";

type StepKey = "programme" | "student" | "emergency" | "documents" | "payment" | "review";
type PaymentArrangement = "" | "Lump Sum" | "Installment Plan" | "Semester Based Payment";
type PaymentSource =
  | ""
  | "EPF Withdrawal (KWSP)"
  | "Cash / Online Transfer"
  | "Sponsorship / Staff Benefit"
  | "Loan / Financing"
  | "Other";

type DocumentFields = {
  identityDocument: File | null;
  passportPhoto: File | null;
  apelCertificate: File | null;
  transcript: File | null;
  certificate: File | null;
  otherSupportingDocument: File | null;
  englishCertificate: File | null;
  cvResume: File | null;
  passportCopyInternational: File | null;
  completedAdmissionForm: File | null;
  completedHealthDeclaration: File | null;
  emgsPaymentReceipt: File | null;
};

type FormState = {
  logoUrl: string;
  capturedEmail: string;
  applicantType: string;
  levelOfStudy: string;
  programme: string;
  intake: string;
  entryQualificationType: string;
  proposedSupervisor: string;
  referralSource: string;
  partnerCode: string;
  fullName: string;
  idPassport: string;
  gender: string;
  email: string;
  phoneNumber: string;
  country: string;
  fullAddress: string;
  placeOfBirth: string;
  nationality: string;
  race: string;
  religion: string;
  maritalStatus: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyAddress: string;
  emergencySameAsApplicant: boolean;
  paymentArrangement: PaymentArrangement;
  installmentFrequency: string;
  paymentSource: PaymentSource;
  paymentSourceOther: string;
  declarationAccepted: boolean;
  documents: DocumentFields;
};

type VisibleDocumentFields = {
  showApelCertificate: boolean;
  showTranscript: boolean;
  showAcademicCertificate: boolean;
  showOtherSupportingDocument: boolean;
  showEnglishCertificate: boolean;
  showCvResume: boolean;
  showPassportCopyInternational: boolean;
  showCompletedAdmissionForm: boolean;
  showCompletedHealthDeclaration: boolean;
  showEmgsPaymentReceipt: boolean;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type ValidationErrors = Record<string, string>;

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbxOWG4QCGfkun1EWEYrUegGfWVLR0nXsewGB6j-pStipRKgGOnsv2RKMUtJMGfW5cI/exec";

const STEPS: { key: StepKey; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "programme", title: "Programme Selection", icon: Mail },
  { key: "student", title: "Student Information", icon: User },
  { key: "emergency", title: "Emergency Contact", icon: Phone },
  { key: "documents", title: "Document Upload", icon: FolderOpen },
  { key: "payment", title: "Payment Details", icon: CreditCard },
  { key: "review", title: "Review & Submit", icon: ShieldCheck },
];

const LEVELS_OF_STUDY = ["Diploma", "Bachelor", "Master", "Doctorate", "Package", "Other"];
const ENTRY_QUALIFICATION_TYPES = [
  "Academic Qualification",
  "APEL",
  "SKM / TVET / Skills Qualification",
  "Professional / Other Qualification",
];
const INTAKE_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const PROGRAMME_OPTIONS: Record<string, string[]> = {
  Diploma: [],
  Bachelor: ["BBA - Bachelor in Business Administration"],
  Master: [
    "MBA - Master of Business Administration",
    "MBM - Master in Business Management",
    "MHUM - Master in Hajj & Umrah Management",
  ],
  Doctorate: [
    "PhD - Doctor of Philosophy in Management",
    "DBA - Doctorate of Business Administration",
  ],
  Package: [
    "MBM + PhD - Master in Business Management & PhD (Package)",
    "MBA + PhD - Master of Business Administration & PhD (Package)",
  ],
  Other: ["Other"],
};

const COUNTRIES = [
  "Malaysia",
  "Afghanistan",
  "Bangladesh",
  "Brunei",
  "Cambodia",
  "China",
  "India",
  "Indonesia",
  "Nepal",
  "Pakistan",
  "Singapore",
  "Sri Lanka",
  "Thailand",
  "Vietnam",
  "Zimbabwe",
  "Other",
];

const NATIONALITIES = [
  "Malaysian",
  "Bruneian",
  "Indonesian",
  "Singaporean",
  "Thai",
  "Filipino",
  "Chinese (China)",
  "Indian (India)",
  "Bangladeshi",
  "Nepalese",
  "Pakistani",
  "Sri Lankan",
  "Vietnamese",
  "Cambodian",
  "Other",
];

const RACES = [
  "Bajau",
  "Bidayuh",
  "Bisaya",
  "Brunei",
  "Bugis",
  "Bumiputera Sabah",
  "Bumiputera Sarawak",
  "Dusun",
  "Iban",
  "India",
  "Indian Muslim",
  "Jakun",
  "Jawa",
  "Kadazan",
  "Kayan",
  "Kelabit",
  "Kedayan",
  "Kenyah",
  "Malay",
  "Melanau",
  "Murut",
  "Other",
];

const RELIGIONS = [
  "Islam",
  "Christianity (Christian)",
  "Buddhism",
  "Hinduism",
  "Sikhism",
  "Taoism",
  "Confucianism",
  "Bahai",
  "Judaism",
  "No Religion",
  "Others",
];

const MARITAL_STATUSES = ["Single", "Married", "Married (Separated)", "Divorced", "Widowed"];
const RELATIONSHIPS = ["Father", "Mother", "Spouse", "Friend", "Guardian", "Sibling", "Other"];
const INSTALLMENT_FREQUENCIES = ["6 months", "12 months"];
const PAYMENT_SOURCES: PaymentSource[] = [
  "EPF Withdrawal (KWSP)",
  "Cash / Online Transfer",
  "Sponsorship / Staff Benefit",
  "Loan / Financing",
  "Other",
];
const REFERRAL_SOURCES = [
  "Direct / Self Enquiry",
  "Agent / Partner",
  "Education Consultant",
  "Friend / Family",
  "Social Media",
  "Walk-in / Direct Enquiry",
];
const PARTNER_CODES = ["YPR001", "YEG001", "OE001", "IUCINT001"];

const initialForm: FormState = {
  logoUrl: "/innovative-logo.png",
  capturedEmail: "",
  applicantType: "",
  levelOfStudy: "",
  programme: "",
  intake: "",
  entryQualificationType: "",
  proposedSupervisor: "",
  referralSource: "",
  partnerCode: "",
  fullName: "",
  idPassport: "",
  gender: "",
  email: "",
  phoneNumber: "",
  country: "",
  fullAddress: "",
  placeOfBirth: "",
  nationality: "",
  race: "",
  religion: "",
  maritalStatus: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  emergencyAddress: "",
  emergencySameAsApplicant: false,
  paymentArrangement: "",
  installmentFrequency: "",
  paymentSource: "",
  paymentSourceOther: "",
  declarationAccepted: false,
  documents: {
    identityDocument: null,
    passportPhoto: null,
    apelCertificate: null,
    transcript: null,
    certificate: null,
    otherSupportingDocument: null,
    englishCertificate: null,
    cvResume: null,
    passportCopyInternational: null,
    completedAdmissionForm: null,
    completedHealthDeclaration: null,
    emgsPaymentReceipt: null,
  },
};

function toUppercase(value: string) {
  return value.toUpperCase();
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isBlank(value: string) {
  return value.trim().length === 0;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getProgrammesByLevel(levelOfStudy: string) {
  return PROGRAMME_OPTIONS[levelOfStudy] ?? [];
}

function getVisibleDocumentFields(applicantType: string, entryQualificationType: string): VisibleDocumentFields {
  const isInternational = applicantType === "International (Non-Malaysian Citizen)";
  return {
    showApelCertificate: entryQualificationType === "APEL",
    showTranscript: entryQualificationType === "Academic Qualification",
    showAcademicCertificate:
      entryQualificationType === "Academic Qualification" ||
      entryQualificationType === "SKM / TVET / Skills Qualification",
    showOtherSupportingDocument: !isBlank(entryQualificationType),
    showEnglishCertificate: !isBlank(entryQualificationType),
    showCvResume: !isBlank(entryQualificationType),
    showPassportCopyInternational: isInternational,
    showCompletedAdmissionForm: isInternational,
    showCompletedHealthDeclaration: isInternational,
    showEmgsPaymentReceipt: isInternational,
  };
}

function buildPayload(form: FormState) {
  return {
    logoUrl: form.logoUrl,
    capturedEmail: form.capturedEmail,
    applicantType: form.applicantType,
    levelOfStudy: form.levelOfStudy,
    programme: form.programme,
    intake: form.intake,
    entryQualificationType: form.entryQualificationType,
    proposedSupervisor: form.proposedSupervisor,
    referralSource: form.referralSource,
    partnerCode: form.partnerCode,
    fullName: toTitleCase(form.fullName),
    fullNameRaw: form.fullName,
    idPassport: form.idPassport,
    gender: form.gender,
    email: form.email,
    phoneNumber: form.phoneNumber,
    country: form.country,
    fullAddress: form.fullAddress,
    placeOfBirth: form.placeOfBirth,
    nationality: form.nationality,
    race: form.race,
    religion: form.religion,
    maritalStatus: form.maritalStatus,
    emergencyName: form.emergencyName,
    emergencyRelationship: form.emergencyRelationship,
    emergencyPhone: form.emergencyPhone,
    emergencyAddress: form.emergencyAddress,
    emergencySameAsApplicant: form.emergencySameAsApplicant,
    paymentArrangement: form.paymentArrangement,
    installmentFrequency: form.installmentFrequency,
    paymentSource: form.paymentSource,
    paymentSourceOther: form.paymentSourceOther,
    declarationAccepted: form.declarationAccepted,
    submittedAt: new Date().toISOString(),
  };
}

function getRequiredDocumentKeys(
  visible: VisibleDocumentFields,
  form: FormState
): { key: keyof DocumentFields; label: string }[] {
  const items: { key: keyof DocumentFields; label: string }[] = [
    {
      key: "passportPhoto",
      label: "Passport Size Photo",
    },
  ];

  if (form.applicantType !== "International (Non-Malaysian Citizen)") {
    items.unshift({ key: "identityDocument", label: "Identity Document (IC/Passport)" });
  }

  if (visible.showPassportCopyInternational) {
    items.push({ key: "passportCopyInternational", label: "Passport Copy" });
    items.push({ key: "completedAdmissionForm", label: "Completed Admission Form" });
    items.push({ key: "completedHealthDeclaration", label: "Completed Health Declaration Form" });
    items.push({ key: "emgsPaymentReceipt", label: "EMGS / Visa Related Payment Receipt" });
  }

  if (visible.showApelCertificate) {
    items.push({ key: "apelCertificate", label: "APEL Certificate" });
  }

  if (visible.showTranscript) {
    items.push({ key: "transcript", label: "Highest Academic Transcript" });
  }

  if (visible.showAcademicCertificate) {
    items.push({ key: "certificate", label: "Highest Academic Certificate / Relevant Skills Certificate" });
  }

  if (form.entryQualificationType === "Professional / Other Qualification") {
    items.push({ key: "otherSupportingDocument", label: "Other Supporting Document" });
  }

  if (
    form.entryQualificationType === "APEL" ||
    form.entryQualificationType === "Professional / Other Qualification"
  ) {
    items.push({ key: "cvResume", label: "Curriculum Vitae (CV) / Resume" });
  }

  return items;
}

function validateStep(
  stepIndex: number,
  form: FormState,
  visibleDocumentFields: VisibleDocumentFields,
  isPartnerFlow: boolean
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (stepIndex === 0) {
    if (!form.capturedEmail.trim()) errors.capturedEmail = "Email is required.";
    else if (!isValidEmail(form.capturedEmail)) errors.capturedEmail = "Please enter a valid email.";
    if (!form.applicantType) errors.applicantType = "Applicant type is required.";
    if (!form.levelOfStudy) errors.levelOfStudy = "Level of study is required.";
    if (!form.programme) errors.programme = "Programme is required.";
    if (!form.intake) errors.intake = "Intake is required.";
    if (!form.entryQualificationType) errors.entryQualificationType = "Entry qualification type is required.";
    if (isPartnerFlow && !form.partnerCode) errors.partnerCode = "Partner / agent code is required.";
  }

  if (stepIndex === 1) {
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.idPassport.trim()) errors.idPassport = "ID / Passport number is required.";
    if (!form.gender) errors.gender = "Gender is required.";
    if (!form.email.trim()) errors.email = "Email address is required.";
    else if (!isValidEmail(form.email)) errors.email = "Please enter a valid email address.";
    if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required.";
    if (!form.country) errors.country = "Country is required.";
    if (!form.fullAddress.trim()) errors.fullAddress = "Full address is required.";
    if (!form.placeOfBirth.trim()) errors.placeOfBirth = "Place of birth is required.";
    if (!form.nationality) errors.nationality = "Nationality is required.";
    if (!form.race) errors.race = "Race is required.";
    if (!form.religion) errors.religion = "Religion is required.";
    if (!form.maritalStatus) errors.maritalStatus = "Marital status is required.";
  }

  if (stepIndex === 2) {
    if (!form.emergencyName.trim()) errors.emergencyName = "Emergency contact name is required.";
    if (!form.emergencyRelationship) errors.emergencyRelationship = "Relationship is required.";
    if (!form.emergencyPhone.trim()) errors.emergencyPhone = "Emergency contact phone number is required.";
    if (!form.emergencyAddress.trim()) errors.emergencyAddress = "Emergency contact address is required.";
  }

  if (stepIndex === 3) {
    const requiredDocs = getRequiredDocumentKeys(visibleDocumentFields, form);
    requiredDocs.forEach(({ key, label }) => {
      if (!form.documents[key]) errors[key] = `${label} is required.`;
    });
  }

  if (stepIndex === 4) {
    if (!form.paymentArrangement) errors.paymentArrangement = "Payment arrangement is required.";
    if (form.paymentArrangement === "Installment Plan" && !form.installmentFrequency) {
      errors.installmentFrequency = "Preferred frequency is required for installment plan.";
    }
    if (!form.paymentSource) errors.paymentSource = "Payment source is required.";
    if (form.paymentSource === "Other" && !form.paymentSourceOther.trim()) {
      errors.paymentSourceOther = "Please specify your payment source.";
    }
  }

  if (stepIndex === 5) {
    if (!form.declarationAccepted) errors.declarationAccepted = "You must accept the declaration before submitting.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function FileRow({
  label,
  required = false,
  note,
  file,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  note?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${error ? "border-red-300" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-slate-900">
            {label} {required ? <span className="text-red-600">*</span> : null}
          </p>
          {note ? <p className="mt-1 text-sm text-slate-500">{note}</p> : null}
          {file ? <p className="mt-2 text-sm text-emerald-700">Selected: {file.name}</p> : null}
          <FieldError message={error} />
        </div>
        <Label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <Upload className="h-4 w-4" />
          Upload File
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </Label>
      </div>
    </div>
  );
}

function DownloadCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" type="button">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

export default function IUCAdmissionFormUI() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const progress = useMemo(() => ((currentStep + 1) / STEPS.length) * 100, [currentStep]);
  const availableProgrammes = useMemo(() => getProgrammesByLevel(form.levelOfStudy), [form.levelOfStudy]);
  const visibleDocumentFields = useMemo(
    () => getVisibleDocumentFields(form.applicantType, form.entryQualificationType),
    [form.applicantType, form.entryQualificationType]
  );
  const isInternational = form.applicantType === "International (Non-Malaysian Citizen)";
  const isPartnerFlow = form.referralSource === "Agent / Partner" || form.referralSource === "Education Consultant";
  const isEpf = form.paymentSource === "EPF Withdrawal (KWSP)";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      if (key === "levelOfStudy") return { ...prev, levelOfStudy: value as string, programme: "" };
      if (key === "referralSource") return { ...prev, referralSource: value as string, partnerCode: "" };
      return { ...prev, [key]: value };
    });

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function updateDocument(key: keyof DocumentFields, file: File | null) {
    setForm((prev) => ({
      ...prev,
      documents: { ...prev.documents, [key]: file },
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  useEffect(() => {
    if (form.emergencySameAsApplicant) {
      setForm((prev) => ({ ...prev, emergencyAddress: prev.fullAddress }));
    }
  }, [form.emergencySameAsApplicant, form.fullAddress]);

  useEffect(() => {
    setForm((prev) => {
      const nextDocs = { ...prev.documents };

      if (prev.entryQualificationType !== "APEL") nextDocs.apelCertificate = null;
      if (prev.entryQualificationType !== "Academic Qualification") nextDocs.transcript = null;

      if (
        prev.entryQualificationType !== "Academic Qualification" &&
        prev.entryQualificationType !== "SKM / TVET / Skills Qualification"
      ) {
        nextDocs.certificate = null;
      }

      if (prev.applicantType !== "International (Non-Malaysian Citizen)") {
        nextDocs.passportCopyInternational = null;
        nextDocs.completedAdmissionForm = null;
        nextDocs.completedHealthDeclaration = null;
        nextDocs.emgsPaymentReceipt = null;
      }

      return { ...prev, documents: nextDocs };
    });
  }, [form.entryQualificationType, form.applicantType]);

  function goToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    const validation = validateStep(currentStep, form, visibleDocumentFields, isPartnerFlow);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    const validation = validateStep(5, form, visibleDocumentFields, isPartnerFlow);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage("");

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(buildPayload(form)));

      Object.entries(form.documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let result: any = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = { raw: text };
      }

      if (!response.ok) {
        throw new Error(result?.message || "Submission failed. Please try again.");
      }

      setSubmitStatus("success");
      setSubmitMessage(result?.message || "Application submitted successfully.");
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed. Please try again.";
      setSubmitStatus("error");
      setSubmitMessage(message);
    }
  }

  function renderProgrammeSection() {
    return (
      <div className="grid gap-6">
        <div>
          <Label>Email <span className="text-red-600">*</span></Label>
          <Input
            type="email"
            value={form.capturedEmail}
            onChange={(e) => updateField("capturedEmail", e.target.value)}
            placeholder="yourname@email.com"
            className="mt-2 h-12 rounded-xl"
          />
          <FieldError message={errors.capturedEmail} />
        </div>

        <div>
          <Label>Applicant Type <span className="text-red-600">*</span></Label>
          <RadioGroup
            value={form.applicantType}
            onValueChange={(value) => updateField("applicantType", value)}
            className="mt-3 grid gap-3 md:grid-cols-2"
          >
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
              <RadioGroupItem value="Local (Malaysian Citizen)" />
              <span>Local (Malaysian Citizen)</span>
            </Label>
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
              <RadioGroupItem value="International (Non-Malaysian Citizen)" />
              <span>International (Non-Malaysian Citizen)</span>
            </Label>
          </RadioGroup>
          <FieldError message={errors.applicantType} />
        </div>

        {isInternational ? (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl bg-white p-2 text-blue-700 shadow-sm">
                <Globe className="h-5 w-5" />
              </div>
              <div className="w-full">
                <h3 className="text-lg font-semibold text-slate-900">International Applicant Information</h3>
                <p className="mt-1 text-sm text-slate-700">
                  Please download, complete, and upload the required international forms in the Document Upload section.
                </p>
                <div className="mt-4 grid gap-4">
                  <DownloadCard
                    title="Admission Form"
                    description="Download, complete, and upload the signed admission form in the document section."
                  />
                  <DownloadCard
                    title="Health Declaration Form"
                    description="Download, complete, sign, and upload together with your international application documents."
                  />
                  <DownloadCard
                    title="EMGS / Visa Fee Details"
                    description="Contains EMGS and visa processing fee details, payment instruction, and related international charges."
                  />
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                  <p className="font-semibold text-slate-900">International Fee Summary</p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    <p>EMGS and Visa Processing Fee – MYR 3,200</p>
                    <p>Application Fee – MYR 500</p>
                    <p>Registration Fee – MYR 4,000</p>
                    <p>Airport Transfer – MYR 250</p>
                  </div>
                  <p className="mt-3 font-semibold text-[#2d2363]">Total: MYR 7,950</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <Label>Level of Study <span className="text-red-600">*</span></Label>
          <Select value={form.levelOfStudy} onValueChange={(value) => updateField("levelOfStudy", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select level of study" />
            </SelectTrigger>
            <SelectContent>
              {LEVELS_OF_STUDY.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.levelOfStudy} />
          {form.levelOfStudy === "Diploma" ? (
            <p className="mt-1 text-sm text-slate-500">Diploma option is intentionally disabled for IPGS current release.</p>
          ) : null}
        </div>

        <div>
          <Label>Intended Programme of Study <span className="text-red-600">*</span></Label>
          <Select
            value={form.programme}
            onValueChange={(value) => updateField("programme", value)}
            disabled={!form.levelOfStudy || form.levelOfStudy === "Diploma"}
          >
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue
                placeholder={
                  !form.levelOfStudy
                    ? "Please select level of study first"
                    : form.levelOfStudy === "Diploma"
                    ? "Diploma programme list is disabled for current release"
                    : "Select programme"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableProgrammes.map((programme) => (
                <SelectItem key={programme} value={programme}>{programme}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.programme} />
        </div>

        <div>
          <Label>Intake <span className="text-red-600">*</span></Label>
          <Select value={form.intake} onValueChange={(value) => updateField("intake", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select intake month" />
            </SelectTrigger>
            <SelectContent>
              {INTAKE_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.intake} />
        </div>

        <div>
          <Label>Entry Qualification Type <span className="text-red-600">*</span></Label>
          <Select value={form.entryQualificationType} onValueChange={(value) => updateField("entryQualificationType", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select entry qualification type" />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_QUALIFICATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.entryQualificationType} />
        </div>

        <div>
          <Label>Proposed Supervisor (if any)</Label>
          <Input
            value={form.proposedSupervisor}
            onChange={(e) => updateField("proposedSupervisor", e.target.value)}
            placeholder="Enter supervisor name"
            className="mt-2 h-12 rounded-xl"
          />
        </div>

        <div>
          <Label>How did you hear about us / Referral Source</Label>
          <Select value={form.referralSource} onValueChange={(value) => updateField("referralSource", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select referral source" />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_SOURCES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPartnerFlow ? (
          <div>
            <Label>Registered Partner / Agent Code <span className="text-red-600">*</span></Label>
            <Select value={form.partnerCode} onValueChange={(value) => updateField("partnerCode", value)}>
              <SelectTrigger className="mt-2 h-12 rounded-xl">
                <SelectValue placeholder="Select partner / agent code" />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_CODES.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.partnerCode} />
            <p className="mt-1 text-sm text-slate-500">
              Only registered partner or agent codes are accepted. Notification email will be identified automatically by the system.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  function renderStudentSection() {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label>Full Name <span className="text-red-600">*</span></Label>
          <Input
            className="mt-2 h-12 rounded-xl uppercase"
            value={form.fullName}
            onChange={(e) => updateField("fullName", toUppercase(e.target.value))}
          />
          <FieldError message={errors.fullName} />
          <p className="mt-1 text-xs text-slate-500">
            Stored in uppercase. Preview format: {toTitleCase(form.fullName || "ahmad bin ali")}
          </p>
        </div>

        <div>
          <Label>ID / Passport Number <span className="text-red-600">*</span></Label>
          <Input
            className="mt-2 h-12 rounded-xl"
            value={form.idPassport}
            onChange={(e) => updateField("idPassport", e.target.value)}
          />
          <FieldError message={errors.idPassport} />
        </div>

        <div>
          <Label>Gender <span className="text-red-600">*</span></Label>
          <RadioGroup
            value={form.gender}
            onValueChange={(value) => updateField("gender", value)}
            className="mt-3 flex gap-4"
          >
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3">
              <RadioGroupItem value="Male" />
              <span>Male</span>
            </Label>
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3">
              <RadioGroupItem value="Female" />
              <span>Female</span>
            </Label>
          </RadioGroup>
          <FieldError message={errors.gender} />
        </div>

        <div>
          <Label>Email Address <span className="text-red-600">*</span></Label>
          <Input
            type="email"
            className="mt-2 h-12 rounded-xl"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <Label>Phone Number <span className="text-red-600">*</span></Label>
          <Input
            className="mt-2 h-12 rounded-xl"
            value={form.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
          />
          <FieldError message={errors.phoneNumber} />
        </div>

        <div>
          <Label>Country <span className="text-red-600">*</span></Label>
          <Select value={form.country} onValueChange={(value) => updateField("country", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.country} />
        </div>

        <div className="md:col-span-2">
          <Label>Full Address <span className="text-red-600">*</span></Label>
          <Textarea
            className="mt-2 min-h-[120px] rounded-2xl uppercase"
            value={form.fullAddress}
            onChange={(e) => updateField("fullAddress", toUppercase(e.target.value))}
          />
          <FieldError message={errors.fullAddress} />
        </div>

        <div>
          <Label>Place of Birth (Include State of Birth) <span className="text-red-600">*</span></Label>
          <Input
            className="mt-2 h-12 rounded-xl uppercase"
            value={form.placeOfBirth}
            onChange={(e) => updateField("placeOfBirth", toUppercase(e.target.value))}
            placeholder="HOSPITAL BESAR ALOR SETAR, KEDAH"
          />
          <FieldError message={errors.placeOfBirth} />
        </div>

        <div>
          <Label>Nationality <span className="text-red-600">*</span></Label>
          <Select value={form.nationality} onValueChange={(value) => updateField("nationality", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              {NATIONALITIES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.nationality} />
        </div>

        <div>
          <Label>Race <span className="text-red-600">*</span></Label>
          <Select value={form.race} onValueChange={(value) => updateField("race", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select race" />
            </SelectTrigger>
            <SelectContent>
              {RACES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.race} />
        </div>

        <div>
          <Label>Religion <span className="text-red-600">*</span></Label>
          <Select value={form.religion} onValueChange={(value) => updateField("religion", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              {RELIGIONS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.religion} />
        </div>

        <div>
          <Label>Marital Status <span className="text-red-600">*</span></Label>
          <Select value={form.maritalStatus} onValueChange={(value) => updateField("maritalStatus", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              {MARITAL_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.maritalStatus} />
        </div>
      </div>
    );
  }

  function renderEmergencySection() {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label>Full Name of Emergency Contact <span className="text-red-600">*</span></Label>
          <Input
            className="mt-2 h-12 rounded-xl"
            value={form.emergencyName}
            onChange={(e) => updateField("emergencyName", e.target.value)}
          />
          <FieldError message={errors.emergencyName} />
        </div>

        <div>
          <Label>Relationship to Applicant <span className="text-red-600">*</span></Label>
          <Select value={form.emergencyRelationship} onValueChange={(value) => updateField("emergencyRelationship", value)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.emergencyRelationship} />
        </div>

        <div>
          <Label>Emergency Contact Phone Number <span className="text-red-600">*</span></Label>
          <Input
            className="mt-2 h-12 rounded-xl"
            value={form.emergencyPhone}
            onChange={(e) => updateField("emergencyPhone", e.target.value)}
          />
          <FieldError message={errors.emergencyPhone} />
        </div>

        <div className="md:col-span-2 rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="same-address"
              checked={form.emergencySameAsApplicant}
              onCheckedChange={(checked) => updateField("emergencySameAsApplicant", Boolean(checked))}
            />
            <Label htmlFor="same-address" className="cursor-pointer">
              Emergency contact address is the same as applicant address
            </Label>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Emergency Contact Address</Label>
          <Textarea
            disabled={form.emergencySameAsApplicant}
            className="mt-2 min-h-[120px] rounded-2xl uppercase disabled:bg-slate-50"
            value={form.emergencyAddress}
            onChange={(e) => updateField("emergencyAddress", toUppercase(e.target.value))}
            placeholder="Leave blank if same as applicant address"
          />
          <FieldError message={errors.emergencyAddress} />
        </div>
      </div>
    );
  }

  function renderDocumentsSection() {
    const cvRequired =
      form.entryQualificationType === "APEL" ||
      form.entryQualificationType === "Professional / Other Qualification";

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Upload Instruction</p>
          <p className="mt-1">
            Accepted file types: PDF, JPG, JPEG, PNG. Maximum size: 5MB per document and 2MB for passport size photo.
          </p>
          <p className="mt-1">
            Please compress your file before upload if your file size exceeds the allowed limit.
          </p>
          {isInternational ? (
            <p className="mt-1">For passport copy upload, maximum recommended size is 7MB.</p>
          ) : null}
        </div>

        <FileRow
          label={isInternational ? "Identity Document (National ID, if available)" : "Identity Document (IC/Passport)"}
          required={!isInternational}
          note="Accepted file types: PDF, JPG, JPEG, PNG. Maximum size: 5MB."
          file={form.documents.identityDocument}
          onChange={(file) => updateDocument("identityDocument", file)}
          error={errors.identityDocument}
        />

        <FileRow
          label="Passport Size Photo"
          required
          note="This photo will be used for Student ID Card and Student Portal profile. Maximum size 2MB."
          file={form.documents.passportPhoto}
          onChange={(file) => updateDocument("passportPhoto", file)}
          error={errors.passportPhoto}
        />

        {visibleDocumentFields.showPassportCopyInternational ? (
          <FileRow
            label="Passport Copy"
            required
            note="Upload full passport bio-data page in clear and readable format. Maximum recommended size 7MB."
            file={form.documents.passportCopyInternational}
            onChange={(file) => updateDocument("passportCopyInternational", file)}
            error={errors.passportCopyInternational}
          />
        ) : null}

        {visibleDocumentFields.showApelCertificate ? (
          <FileRow
            label="APEL Certificate"
            required
            note="Required for applicants applying through APEL pathway."
            file={form.documents.apelCertificate}
            onChange={(file) => updateDocument("apelCertificate", file)}
            error={errors.apelCertificate}
          />
        ) : null}

        {visibleDocumentFields.showTranscript ? (
          <FileRow
            label="Highest Academic Transcript"
            required
            note="Required for academic qualification pathway."
            file={form.documents.transcript}
            onChange={(file) => updateDocument("transcript", file)}
            error={errors.transcript}
          />
        ) : null}

        {visibleDocumentFields.showAcademicCertificate ? (
          <FileRow
            label={
              form.entryQualificationType === "SKM / TVET / Skills Qualification"
                ? "Relevant Skills Certificate"
                : "Highest Academic Certificate"
            }
            required
            note="Upload the relevant supporting academic or skills certificate."
            file={form.documents.certificate}
            onChange={(file) => updateDocument("certificate", file)}
            error={errors.certificate}
          />
        ) : null}

        {visibleDocumentFields.showOtherSupportingDocument ? (
          <FileRow
            label="Other Supporting Document"
            required={form.entryQualificationType === "Professional / Other Qualification"}
            note="Upload any supporting document relevant to your admission pathway."
            file={form.documents.otherSupportingDocument}
            onChange={(file) => updateDocument("otherSupportingDocument", file)}
            error={errors.otherSupportingDocument}
          />
        ) : null}

        {visibleDocumentFields.showEnglishCertificate ? (
          <FileRow
            label="English Language Proficiency Certificate"
            note="International applicants may be required to provide this document."
            file={form.documents.englishCertificate}
            onChange={(file) => updateDocument("englishCertificate", file)}
            error={errors.englishCertificate}
          />
        ) : null}

        {visibleDocumentFields.showCvResume ? (
          <FileRow
            label="Curriculum Vitae (CV) / Resume"
            required={cvRequired}
            note="Include academic background and work experience."
            file={form.documents.cvResume}
            onChange={(file) => updateDocument("cvResume", file)}
            error={errors.cvResume}
          />
        ) : null}

        {visibleDocumentFields.showCompletedAdmissionForm ? (
          <FileRow
            label="Completed Admission Form"
            required
            note="Upload the completed international admission form downloaded earlier."
            file={form.documents.completedAdmissionForm}
            onChange={(file) => updateDocument("completedAdmissionForm", file)}
            error={errors.completedAdmissionForm}
          />
        ) : null}

        {visibleDocumentFields.showCompletedHealthDeclaration ? (
          <FileRow
            label="Completed Health Declaration Form"
            required
            note="Upload the completed and signed health declaration form."
            file={form.documents.completedHealthDeclaration}
            onChange={(file) => updateDocument("completedHealthDeclaration", file)}
            error={errors.completedHealthDeclaration}
          />
        ) : null}

        {visibleDocumentFields.showEmgsPaymentReceipt ? (
          <FileRow
            label="EMGS / Visa Related Payment Receipt"
            required
            note="Upload the payment receipt for international fee processing."
            file={form.documents.emgsPaymentReceipt}
            onChange={(file) => updateDocument("emgsPaymentReceipt", file)}
            error={errors.emgsPaymentReceipt}
          />
        ) : null}
      </div>
    );
  }

  function renderPaymentSection() {
    return (
      <div className="grid gap-6">
        <div>
          <Label>Payment Arrangement <span className="text-red-600">*</span></Label>
          <RadioGroup
            value={form.paymentArrangement}
            onValueChange={(value) => updateField("paymentArrangement", value as PaymentArrangement)}
            className="mt-3 grid gap-3 md:grid-cols-2"
          >
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
              <RadioGroupItem value="Lump Sum" />
              <span>Lump Sum (One-time payment)</span>
            </Label>
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
              <RadioGroupItem value="Installment Plan" />
              <span>Installment Plan (Every 7th each month)</span>
            </Label>
            <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
              <RadioGroupItem value="Semester Based Payment" />
              <span>Semester Based Payment</span>
            </Label>
          </RadioGroup>
          <FieldError message={errors.paymentArrangement} />
        </div>

        {form.paymentArrangement === "Installment Plan" ? (
          <div>
            <Label>Preferred Frequency</Label>
            <Select value={form.installmentFrequency} onValueChange={(value) => updateField("installmentFrequency", value)}>
              <SelectTrigger className="mt-2 h-12 rounded-xl">
                <SelectValue placeholder="Select installment frequency" />
              </SelectTrigger>
              <SelectContent>
                {INSTALLMENT_FREQUENCIES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.installmentFrequency} />
            <p className="mt-1 text-sm text-slate-500">Available only for installment plan.</p>
          </div>
        ) : null}

        <div>
          <Label>Payment Source <span className="text-red-600">*</span></Label>
          <RadioGroup
            value={form.paymentSource}
            onValueChange={(value) => updateField("paymentSource", value as PaymentSource)}
            className="mt-3 grid gap-3 md:grid-cols-2"
          >
            {PAYMENT_SOURCES.map((item) => (
              <Label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
                <RadioGroupItem value={item} />
                <span>{item}</span>
              </Label>
            ))}
          </RadioGroup>
          <FieldError message={errors.paymentSource} />
        </div>

        {form.paymentSource === "Other" ? (
          <div>
            <Label>Please Specify</Label>
            <Input
              className="mt-2 h-12 rounded-xl"
              value={form.paymentSourceOther}
              onChange={(e) => updateField("paymentSourceOther", e.target.value)}
            />
            <FieldError message={errors.paymentSourceOther} />
          </div>
        ) : null}

        {isEpf ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">EPF / KWSP Notification</p>
            <p className="mt-1">
              This application will be flagged for bursar follow-up. The EPF submission progress can be monitored internally after form submission.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  function renderReviewSection() {
    const referralDisplay =
      form.partnerCode && isPartnerFlow
        ? `${form.referralSource} (${form.partnerCode})`
        : form.referralSource || "-";

    const paymentSourceDisplay =
      form.paymentSource === "Other"
        ? form.paymentSourceOther || "Other"
        : form.paymentSource || "-";

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Review Your Application</h3>
          <p className="mt-1 text-sm text-slate-600">Please review the summary before submitting.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Programme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Email:</span> {form.capturedEmail || "-"}</p>
              <p><span className="font-medium">Applicant Type:</span> {form.applicantType || "-"}</p>
              <p><span className="font-medium">Level of Study:</span> {form.levelOfStudy || "-"}</p>
              <p><span className="font-medium">Programme:</span> {form.programme || "-"}</p>
              <p><span className="font-medium">Intake:</span> {form.intake || "-"}</p>
              <p><span className="font-medium">Entry Qualification Type:</span> {form.entryQualificationType || "-"}</p>
              <p><span className="font-medium">Supervisor:</span> {form.proposedSupervisor || "-"}</p>
              <p><span className="font-medium">Referral:</span> {referralDisplay}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Full Name:</span> {toTitleCase(form.fullName) || "-"}</p>
              <p><span className="font-medium">ID / Passport:</span> {form.idPassport || "-"}</p>
              <p><span className="font-medium">Email:</span> {form.email || "-"}</p>
              <p><span className="font-medium">Phone:</span> {form.phoneNumber || "-"}</p>
              <p><span className="font-medium">Country:</span> {form.country || "-"}</p>
              <p><span className="font-medium">Nationality:</span> {form.nationality || "-"}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Name:</span> {form.emergencyName || "-"}</p>
              <p><span className="font-medium">Relationship:</span> {form.emergencyRelationship || "-"}</p>
              <p><span className="font-medium">Phone:</span> {form.emergencyPhone || "-"}</p>
              <p><span className="font-medium">Address:</span> {form.emergencyAddress || "-"}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Arrangement:</span> {form.paymentArrangement || "-"}</p>
              <p><span className="font-medium">Frequency:</span> {form.installmentFrequency || "-"}</p>
              <p><span className="font-medium">Source:</span> {paymentSourceDisplay}</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={form.declarationAccepted}
              onCheckedChange={(checked) => updateField("declarationAccepted", Boolean(checked))}
              id="declarationAccepted"
            />
            <div>
              <Label htmlFor="declarationAccepted" className="cursor-pointer text-sm font-medium leading-6 text-slate-900">
                I hereby confirm that all information and documents submitted in this form are true, complete, and accurate to the best of my knowledge. I understand that Innovative University College reserves the right to reject, defer, withdraw, or revoke this application or any offer issued if any information or document provided is found to be false, misleading, incomplete, or invalid.
              </Label>
              <FieldError message={errors.declarationAccepted} />
            </div>
          </div>
        </div>

        <Separator />

        {submitStatus === "success" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Submission Successful</p>
                <p className="mt-1">{submitMessage}</p>
              </div>
            </div>
          </div>
        ) : null}

        {submitStatus === "error" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Submission Failed</p>
                <p className="mt-1">{submitMessage}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f4ec] via-[#fcfbf8] to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <div className="rounded-2xl bg-[#2d2363] p-4 text-white">
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/15">
                    <img
                      src={form.logoUrl}
                      alt="Innovative University College logo"
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div style={{ display: "none" }} className="h-10 w-10 items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/80">Innovative University College</p>
                    <p className="text-xs text-white/70">Connected to backend endpoint for submission.</p>
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl">IUC Admission Form</CardTitle>
                <CardDescription className="mt-2 text-white/80">Application for Admission</CardDescription>
              </div>

              <div className="pt-4">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Progress</span>
                  <span>{currentStep + 1} / {STEPS.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const active = index === currentStep;
                const done = index < currentStep;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-[#efeafc] text-[#2d2363]"
                        : done
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active ? "bg-white" : done ? "bg-white" : "bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Step {index + 1}</p>
                      <p className="text-sm">{step.title}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Card className="rounded-3xl border-0 shadow-xl">
              <CardHeader className="border-b bg-white/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efeafc] text-[#2d2363]">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{STEPS[currentStep].title}</CardTitle>
                    <CardDescription>Please complete all required information before continuing.</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 md:p-8">
                {currentStep === 0 ? renderProgrammeSection() : null}
                {currentStep === 1 ? renderStudentSection() : null}
                {currentStep === 2 ? renderEmergencySection() : null}
                {currentStep === 3 ? renderDocumentsSection() : null}
                {currentStep === 4 ? renderPaymentSection() : null}
                {currentStep === 5 ? renderReviewSection() : null}

                <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={prevStep}
                    disabled={currentStep === 0 || submitStatus === "submitting"}
                    type="button"
                  >
                    Back
                  </Button>

                  {currentStep < STEPS.length - 1 ? (
                    <Button
                      className="rounded-2xl bg-[#2d2363] px-6 text-white hover:bg-[#241c52]"
                      onClick={nextStep}
                      type="button"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      className="rounded-2xl bg-[#2d2363] px-6 text-white hover:bg-[#241c52]"
                      onClick={handleSubmit}
                      type="button"
                      disabled={submitStatus === "submitting" || submitStatus === "success"}
                    >
                      {submitStatus === "submitting" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </span>
                      ) : submitStatus === "success" ? (
                        "Submitted"
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
