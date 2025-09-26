import * as React from "react";
import Container from "@/components/layout/Container";
import { Link } from "react-router-dom";
import { FileText, ListChecks, MessageSquare } from "lucide-react";

export default function GetStarted() {
  return (
    <div className="min-h-svh">
      <Container className="py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-center">
          Get Started
        </h1>
        <p className="mt-3 text-sm text-muted-foreground text-center max-w-xl mx-auto">
          Choose an action to begin. Click below to open the Test Paper Generator.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          <Link
            to="/app"
            className="group w-full sm:w-72 rounded-xl border bg-white p-6 card-yellow-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-3 text-primary group-hover:bg-primary/15">
                <FileText className="h-10 w-10" aria-hidden="true" />
              </div>
              <div className="text-lg font-semibold">Generate Exam</div>
              <div className="text-xs text-muted-foreground mt-1">
                Open the Test Paper Generator
              </div>
            </div>
          </Link>

          <Link
            to="/app"
            className="group w-full sm:w-72 rounded-xl border bg-white p-6 card-yellow-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-3 text-primary group-hover:bg-primary/15">
                <ListChecks className="h-10 w-10" aria-hidden="true" />
              </div>
              <div className="text-lg font-semibold">Generate MCQs</div>
              <div className="text-xs text-muted-foreground mt-1">
                Create multiple-choice questions from chapters
              </div>
            </div>
          </Link>

          <Link
            to="/app"
            className="group w-full sm:w-72 rounded-xl border bg-white p-6 card-yellow-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-3 text-primary group-hover:bg-primary/15">
                <MessageSquare className="h-10 w-10" aria-hidden="true" />
              </div>
              <div className="text-lg font-semibold">Generate Q&A</div>
              <div className="text-xs text-muted-foreground mt-1">
                Generate question–answer cards for quick revision
              </div>
            </div>
          </Link>
        </div>
      </Container>
    </div>
  );
}
