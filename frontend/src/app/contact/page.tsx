import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the creator of Drafts.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactForm />;
}
