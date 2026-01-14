"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { z } from "zod";
import Spinner from "@/components/Spinner/Spinner";
import { useSession } from "next-auth/react";

import { useGetStudents } from "@/hooks/useStudents";
import { useGetClasses } from "@/hooks/useClasses";
import { useGetSubjects } from "@/hooks/useSubjects";

/* ---------------------------
   Types
--------------------------- */
interface Student {
  id: string;
  firstname: string;
  othername: string | null;
  surname: string;
  class: { id: string; name: string; category: string };
  section?: string | null;
  admissionnumber?: string;
}

interface Class {
  id: string;
  name: string;
  category: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Grading {
  id: string;
  title: string;
  session: string;
  term: string;
  gradingPolicyId?: string;
}

interface Assessment {
  id: string;
  name: string;
  weight?: number;
  maxScore?: number;
}

interface StudentAssessment {
  id?: string | null;
  studentId: string;
  assessmentId: string;
  subjectId: string;
  classId: string;
  gradingId: string;
  score: number;
}

interface StudentGrade {
  id?: string;
  studentId: string;
  subjectId: string;
  classId: string;
  gradingId: string;
  score: number;
  grade?: string;
  remark?: string;
  subjectPosition?: string | null;
}

/* ---------------------------
   Form schema
--------------------------- */
const formSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

/* ---------------------------
   Fetch helper
--------------------------- */
const fetchWithErrorHandling = async (url: string, controller: AbortController) => {
  const res = await fetch(url, { signal: controller.signal });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return data.data ?? data;
};

/* Register AG Grid modules once */
ModuleRegistry.registerModules([AllCommunityModule]);

/* ---------------------------
   Component
--------------------------- */
const Grade: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const gradingId = (params?.id as string) ?? "";

  const toast = useRef<Toast | null>(null);
  const gridRef = useRef<AgGridReact | null>(null);

  const { data: session } = useSession();
  const role = session?.user?.role ?? "Guest";
  const permit = ["super", "admin", "management"].includes(role.toLowerCase());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState<Grading | null>(null);
  const [gradingPolicy, setGradingPolicy] = useState<{ assessments?: Assessment[] } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentAssessments, setStudentAssessments] = useState<StudentAssessment[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [quickFilter, setQuickFilter] = useState("");

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<{ classId: string; subjectId: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { classId: "", subjectId: "" },
  });

  const watchedClassId = watch("classId");
  const watchedSubjectId = watch("subjectId");

  /* ---------------------------
     Role-based hook params
  --------------------------- */
  const studentParams: { teacherid?: string; parentid?: string } = {};
  if (role.toLowerCase() === "teacher" && session?.user?.id) studentParams.teacherid = session.user.id;
  else if (role.toLowerCase() === "parent" && session?.user?.id) studentParams.parentid = session.user.id;

  /* ---------------------------
     Fetch classes, subjects, students (role-aware)
  --------------------------- */
  const { data: fetchedClasses } = useGetClasses({});
  const { data: fetchedSubjects } = useGetSubjects({});
  const { data: fetchedStudents } = useGetStudents(studentParams);

  /* ---------------------------
     Map students to include full class object
  --------------------------- */
  useEffect(() => {
    if (fetchedStudents && fetchedClasses) {
      const mapped: Student[] = fetchedStudents.map((s) => {
        const cls = fetchedClasses.find((c) => c.id === s.classid);
        return {
          ...s,
          class: {
            id: cls?.id ?? s.classid,
            name: cls?.name ?? "Unknown",
            category: "Uncategorized",
          },
        };
      });
      setStudents(mapped);
    }
  }, [fetchedStudents, fetchedClasses]);


  /* ---------------------------
     Filter students by class
  --------------------------- */
  useEffect(() => {
    if (watchedClassId) {
      const filtered = students.filter((s) => s.class.id === watchedClassId);
      setFilteredStudents(filtered);
      setValue("subjectId", "");
      setStudentAssessments([]);
      setStudentGrades([]);
      setLoading(false);
    } else {
      setFilteredStudents([]);
      setStudentAssessments([]);
      setStudentGrades([]);
      setLoading(false);
    }
  }, [watchedClassId, students, setValue]);

  /* ---------------------------
     Fetch grading & policy
  --------------------------- */
  useEffect(() => {
    if (!gradingId) {
      setLoading(false);
      toast.current?.show({ severity: "error", summary: "Invalid Grading", detail: "Grading ID is missing" });
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    const fetchGrading = async () => {
      try {
        if (mounted) setLoading(true);
        const gradingResp = await fetchWithErrorHandling(`/api/gradings/${gradingId}`, controller);
        if (!mounted) return;
        setGrading(gradingResp);

        if (gradingResp?.gradingPolicyId) {
          try {
            const policy = await fetchWithErrorHandling(`/api/policies/${gradingResp.gradingPolicyId}`, controller);
            if (mounted) setGradingPolicy(policy);
          } catch (err) {
            console.warn("Failed to fetch grading policy:", err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchGrading();
    return () => { mounted = false; controller.abort(); };
  }, [gradingId]);

  /* ---------------------------
     Fetch student assessments & grades for selected class+subject
  --------------------------- */
  useEffect(() => {
    if (!gradingId || !watchedClassId || !watchedSubjectId) return;

    const controller = new AbortController();
    let mounted = true;

    const fetchGrades = async () => {
      try {
        setLoading(true);
        const payload = await fetchWithErrorHandling(
          `/api/grade?gradingId=${gradingId}&classId=${watchedClassId}&subjectId=${watchedSubjectId}`,
          controller
        );

        if (!mounted) return;

        setStudentAssessments(payload?.studentAssessments ?? []);
        setStudentGrades(payload?.grades ?? []);
        if (payload?.assessments) {
          setGradingPolicy((prev) => ({ ...(prev ?? {}), assessments: payload.assessments }));
        }
      } catch (err) {
        console.warn("Fetch grades failed:", err);
        setStudentAssessments([]);
        setStudentGrades([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchGrades();
    return () => { mounted = false; controller.abort(); };
  }, [gradingId, watchedClassId, watchedSubjectId]);

  /* ---------------------------
     Lookups for fast access
  --------------------------- */
  const assessmentLookup = useMemo(() => {
    const m = new Map<string, StudentAssessment>();
    for (const sa of studentAssessments) m.set(`${sa.studentId}:${sa.assessmentId}`, sa);
    return m;
  }, [studentAssessments]);

  const studentGradeLookup = useMemo(() => {
    const m = new Map<string, StudentGrade>();
    for (const sg of studentGrades) m.set(sg.studentId, sg);
    return m;
  }, [studentGrades]);

  /* ---------------------------
     Column definitions
  --------------------------- */
  const columnDefs = useMemo<ColDef[]>(() => {
    const assessments = [...(gradingPolicy?.assessments ?? [])];
    const assessmentColumns: ColDef[] = assessments.map((a, idx) => ({
      headerName: a.name,
      field: a.id,
      editable: true,
      valueSetter: (params) => {
        const raw = params.newValue;
        const value = typeof raw === "string" ? Number(raw) : raw;
        if (!Number.isFinite(value) || value < 0 || value > (a.maxScore ?? 100)) return false;
        params.data[a.id] = value;
        return true;
      },
    }));

    return [
      { headerName: "Student Name", field: "name", filter: "agTextColumnFilter", sortable: true },
      ...assessmentColumns,
      { headerName: "Total", field: "serverTotal", valueGetter: (params) => assessments.reduce((sum, a) => sum + (Number(params.data[a.id]) || 0), 0) },
      {
        headerName: "Grade",
        field: "serverGrade",
        valueGetter: (params) => {
          const score = assessments.reduce((sum, a) => sum + (Number(params.data[a.id]) || 0), 0);
          if (score >= 70) return "A";
          if (score >= 60) return "B";
          if (score >= 50) return "C";
          if (score >= 45) return "D";
          if (score >= 40) return "E";
          return "F";
        },
      },
      {
        headerName: "Remark",
        field: "serverRemark",
        valueGetter: (params) => {
          const score = assessments.reduce((sum, a) => sum + (Number(params.data[a.id]) || 0), 0);
          if (score >= 70) return "Excellent";
          if (score >= 60) return "Very Good";
          if (score >= 50) return "Good";
          if (score >= 45) return "Pass";
          if (score >= 40) return "Fair";
          return "Fail";
        },
      },
      { headerName: "Position", field: "subjectPosition", valueGetter: (params) => params.data.subjectPosition ?? "" },
    ];
  }, [gradingPolicy?.assessments]);

  const rowData = useMemo(() => {
    if (!filteredStudents.length) return [];
    const assessments = gradingPolicy?.assessments ?? [];
    return filteredStudents.map((s) => {
      const row: any = { studentId: s.id, name: `${s.firstname} ${s.othername ?? ""} ${s.surname}`.trim() };
      assessments.forEach((a) => {
        const key = `${s.id}:${a.id}`;
        const sa = assessmentLookup.get(key);
        row[a.id] = sa?.score ?? 0;
      });
      const sg = studentGradeLookup.get(s.id);
      row.serverTotal = sg?.score ?? null;
      row.serverGrade = sg?.grade ?? null;
      row.serverRemark = sg?.remark ?? null;
      row.subjectPosition = sg?.subjectPosition ?? null;
      return row;
    });
  }, [filteredStudents, gradingPolicy?.assessments, assessmentLookup, studentGradeLookup]);

  /* ---------------------------
     Save handler
  --------------------------- */
  const onSave = async (data: { classId: string; subjectId: string }) => {
    if (!grading || !gradingPolicy?.assessments) return;

    setSaving(true);
    const gridData: any[] = [];
    gridRef.current?.api.forEachNode((node) => gridData.push(node.data));

    const studentsPayload = gridData.map((row) => ({
      studentId: row.studentId,
      perAssessmentScores: gradingPolicy.assessments!.map((a) => ({ assessmentId: a.id, score: Number(row[a.id] ?? 0) })),
    }));

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradingId: grading.id,
          classId: data.classId,
          subjectId: data.subjectId,
          assessments: gradingPolicy.assessments!.map((a) => a.id),
          students: studentsPayload,
        }),
      });
      if (!res.ok) throw new Error("Failed to save grades");
      const result = await res.json();
      setStudentAssessments(result.studentAssessments ?? []);
      setStudentGrades(result.data ?? []);
      toast.current?.show({ severity: "success", summary: "Success", detail: "Grades saved successfully" });
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message ?? "Failed to save grades" });
    } finally {
      setSaving(false);
    }
  };

  const classOptions = useMemo(() => fetchedClasses?.map((c) => ({ label: c.name, value: c.id })) ?? [], [fetchedClasses]);
  const subjectOptions = useMemo(() => fetchedSubjects?.map((s) => ({ label: s.name, value: s.id })) ?? [], [fetchedSubjects]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner visible={loading} onHide={() => setLoading(false)} /></div>;

  return (
    <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
      <Toast ref={toast} />
      <Spinner visible={saving} onHide={() => setSaving(false)} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 p-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900/80">{grading?.title ?? "Grade Students"}</h2>
        <div className="flex gap-3">
          <Button
            label="Save"
            icon="pi pi-save"
            onClick={handleSubmit(onSave)}
            className="bg-blue-600 text-white rounded-lg border border-blue-600 hover:bg-blue-700 hover:border-blue-700"
            disabled={!watchedClassId || !watchedSubjectId || saving}
          />
          <Button label="Back" icon="pi pi-arrow-left" onClick={() => router.back()} className="bg-red-600 text-white rounded-lg border border-red-600 hover:bg-red-700 hover:border-red-700" />
        </div>
      </div>

      <form className="p-4 space-y-4" onSubmit={handleSubmit(onSave)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <InputText value={grading?.session || ""} disabled className="w-full p-2 border rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <InputText value={grading?.term || ""} disabled className="w-full p-2 border rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Controller name="classId" control={control} render={({ field }) => (
              <Dropdown {...field} options={classOptions} placeholder="Select Class" className={`w-full ${errors.classId ? "p-invalid" : ""}`} onChange={(e) => field.onChange(e.value)} />
            )} />
            {errors.classId && <p className="text-red-500 text-sm mt-1">{errors.classId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <Controller name="subjectId" control={control} render={({ field }) => (
              <Dropdown {...field} options={subjectOptions} placeholder="Select Subject" className={`w-full ${errors.subjectId ? "p-invalid" : ""}`} disabled={!watchedClassId} onChange={(e) => field.onChange(e.value)} />
            )} />
            {errors.subjectId && <p className="text-red-500 text-sm mt-1">{errors.subjectId.message}</p>}
          </div>
        </div>

        {watchedClassId && gradingPolicy?.assessments?.length ? (
          <>
            <div>
              <InputText value={quickFilter} onChange={(e) => setQuickFilter((e.target as HTMLInputElement).value)} placeholder="Search students..." className="w-full p-2 border rounded-md" />
            </div>
            <div className="ag-theme-alpine" style={{ height: "500px", width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={rowData}
                defaultColDef={{ resizable: true, sortable: true, filter: true, suppressMovable: true }}
                quickFilterText={quickFilter}
                domLayout="autoHeight"
                suppressRowClickSelection={true}
              />
            </div>
          </>
        ) : (
          <p className="text-gray-500 mt-4">Select class and subject to view students.</p>
        )}
      </form>
    </section>
  );
};

export default Grade;
