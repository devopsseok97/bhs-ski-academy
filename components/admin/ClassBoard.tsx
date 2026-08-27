"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import StatusPanel from "@/components/ui/StatusPanel";
import Toast from "@/components/ui/Toast";
import { seoulDate } from "@/lib/dates";
import { requestJson } from "@/lib/http";
import ClassCard, { type ClassSummary } from "./classes/ClassCard";
import CreateClassModal from "./classes/CreateClassModal";
import EditClassModal from "./classes/EditClassModal";
import DeleteClassModal from "./classes/DeleteClassModal";
import StudentPicker, { type PickerStudent } from "./classes/StudentPicker";

type Teacher = { id: string; name: string };

type BoardState = {
  classes: ClassSummary[];
  teachers: Teacher[];
  students: PickerStudent[];
};

type FeedbackMessage = { tone: "success" | "error"; text: string } | null;

const EMPTY_STATE: BoardState = { classes: [], teachers: [], students: [] };

function formatDateLabel(date: string) {
  const [, month = 0, day = 0] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

async function loadBoard(date: string, signal: AbortSignal): Promise<BoardState> {
  const [classes, teachers, students] = await Promise.all([
    requestJson<ClassSummary[]>(`/api/admin/classes?date=${encodeURIComponent(date)}`, {
      signal,
    }),
    requestJson<Teacher[]>("/api/admin/teachers", { signal }),
    requestJson<PickerStudent[]>("/api/admin/students", { signal }),
  ]);
  return { classes, teachers, students };
}

function errorText(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

export default function ClassBoard() {
  const [date, setDate] = useState(seoulDate());
  const [selectedSlot, setSelectedSlot] = useState<"AM" | "PM">("AM");
  const [board, setBoard] = useState<BoardState>(EMPTY_STATE);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [pickerClassId, setPickerClassId] = useState<string | null>(null);
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestReload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    loadBoard(date, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setBoard(next);
        setLoadedDate(date);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(errorText(error));
      });
    return () => controller.abort();
  }, [date, reloadKey]);

  const isInitialLoading = loadedDate !== date;

  const amClasses = board.classes.filter((c) => c.slot === "AM");
  const pmClasses = board.classes.filter((c) => c.slot === "PM");
  const activeSlotClasses = selectedSlot === "AM" ? amClasses : pmClasses;

  const editTarget = board.classes.find((c) => c.id === editTargetId) ?? null;
  const deleteTarget = board.classes.find((c) => c.id === deleteTargetId) ?? null;
  const pickerClass = board.classes.find((c) => c.id === pickerClassId) ?? null;

  const openCreateForSlot = (slot: "AM" | "PM") => {
    if (board.teachers.length === 0) {
      setFeedback({ tone: "error", text: "선생님을 먼저 등록해주세요." });
      return;
    }
    setSelectedSlot(slot);
    setCreateOpen(true);
  };

  const handleCreate = async ({
    slot,
    teacherId,
  }: {
    slot: "AM" | "PM";
    teacherId: string;
  }) => {
    setIsCreating(true);
    try {
      await requestJson("/api/admin/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, slot, teacherId }),
      });
      requestReload();
      setSelectedSlot(slot);
      setCreateOpen(false);
      setFeedback({ tone: "success", text: "새 반을 만들었습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (teacherId: string) => {
    if (!editTargetId) return;
    setIsEditing(true);
    try {
      await requestJson(`/api/admin/classes/${editTargetId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      requestReload();
      setEditTargetId(null);
      setFeedback({ tone: "success", text: "담당 선생님을 변경했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeletingId(deleteTargetId);
    try {
      await requestJson(`/api/admin/classes/${deleteTargetId}`, { method: "DELETE" });
      requestReload();
      setDeleteTargetId(null);
      setFeedback({ tone: "success", text: "반을 삭제하고 쿠폰을 복구했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleAssign = async (studentId: string) => {
    if (!pickerClassId) return;
    setAssigningStudentId(studentId);
    try {
      await requestJson(`/api/admin/classes/${pickerClassId}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      requestReload();
      setFeedback({ tone: "success", text: "학생을 배정했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setAssigningStudentId(null);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    setUnassigningId(assignmentId);
    try {
      await requestJson(`/api/admin/assignments/${assignmentId}`, { method: "DELETE" });
      requestReload();
      setFeedback({ tone: "success", text: "배정을 취소하고 쿠폰을 복구했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setUnassigningId(null);
    }
  };

  const pendingClassAction = (klass: ClassSummary): "edit" | "delete" | "assign" | null => {
    if (isDeletingId === klass.id) return "delete";
    if (isEditing && editTargetId === klass.id) return "edit";
    if (assigningStudentId && pickerClassId === klass.id) return "assign";
    return null;
  };

  const renderClasses = (list: ClassSummary[], slot: "AM" | "PM") => {
    if (list.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-surface/80 px-4 py-8 text-center text-sm text-slate">
          {slot === "AM" ? "오전" : "오후"} 반이 아직 없습니다.
        </div>
      );
    }
    return (
      <ul className="flex flex-col gap-4">
        {list.map((klass) => (
          <li key={klass.id}>
            <ClassCard
              klass={klass}
              pendingAssignmentId={unassigningId}
              pendingClassAction={pendingClassAction(klass)}
              onEdit={() => setEditTargetId(klass.id)}
              onDelete={() => setDeleteTargetId(klass.id)}
              onOpenPicker={() => setPickerClassId(klass.id)}
              onUnassign={handleUnassign}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-alpine">반편성</h1>
        <p className="text-sm text-slate">
          날짜를 선택해 오전·오후 반을 만들고 학생을 배정하세요.
        </p>
      </header>

      <section
        aria-label="반편성 필터"
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine sm:max-w-xs">
          날짜
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-alpine md:hidden">시간대</span>
          <div className="flex flex-1 gap-2 md:hidden">
            {(["AM", "PM"] as const).map((slot) => {
              const active = slot === selectedSlot;
              const isAm = slot === "AM";
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={active}
                  className={`flex-1 min-h-[48px] rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                    active
                      ? isAm
                        ? "border-sky bg-sky/10 text-summit"
                        : "border-summit bg-summit/10 text-summit"
                      : "border-border bg-surface text-slate"
                  }`}
                >
                  {isAm ? `오전 (${amClasses.length})` : `오후 (${pmClasses.length})`}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => openCreateForSlot(selectedSlot)}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-alpine px-4 py-2 text-sm font-bold text-white hover:bg-summit md:ml-auto"
          >
            + 반 만들기
          </button>
        </div>
      </section>

      {feedback && (
        <Toast
          tone={feedback.tone}
          message={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {loadError && !isInitialLoading && (
        <Toast
          tone="error"
          message={loadError}
          onDismiss={() => setLoadError(null)}
        />
      )}

      {isInitialLoading ? (
        <StatusPanel
          title={`${formatDateLabel(date)} 반편성 정보를 불러오는 중입니다`}
          description="잠시만 기다려주세요."
          action={<Spinner size="lg" label="반편성 불러오는 중" />}
        />
      ) : loadError && board.classes.length === 0 && board.teachers.length === 0 ? (
        <StatusPanel
          tone="error"
          title="반편성 정보를 불러오지 못했습니다"
          description={loadError}
          action={
            <button
              type="button"
              onClick={() => requestReload()}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-danger px-5 py-2 text-sm font-bold text-white"
            >
              다시 시도
            </button>
          }
        />
      ) : (
        <>
          <div className="md:hidden">{renderClasses(activeSlotClasses, selectedSlot)}</div>
          <div className="hidden gap-6 md:grid md:grid-cols-2">
            <section aria-labelledby="admin-am" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="block h-6 w-1.5 rounded-full bg-sky" />
                  <h2 id="admin-am" className="text-lg font-extrabold text-alpine">
                    오전 ({amClasses.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateForSlot("AM")}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-surface px-3 py-1 text-xs font-bold text-alpine hover:bg-ice"
                >
                  + 오전 반
                </button>
              </div>
              {renderClasses(amClasses, "AM")}
            </section>
            <section aria-labelledby="admin-pm" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="block h-6 w-1.5 rounded-full bg-summit" />
                  <h2 id="admin-pm" className="text-lg font-extrabold text-alpine">
                    오후 ({pmClasses.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateForSlot("PM")}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-surface px-3 py-1 text-xs font-bold text-alpine hover:bg-ice"
                >
                  + 오후 반
                </button>
              </div>
              {renderClasses(pmClasses, "PM")}
            </section>
          </div>
        </>
      )}

      <CreateClassModal
        open={createOpen}
        date={date}
        initialSlot={selectedSlot}
        teachers={board.teachers}
        isSubmitting={isCreating}
        onSubmit={handleCreate}
        onClose={() => {
          if (!isCreating) setCreateOpen(false);
        }}
      />

      <EditClassModal
        open={editTarget !== null}
        klass={editTarget}
        teachers={board.teachers}
        isSubmitting={isEditing}
        onSubmit={handleEditSubmit}
        onClose={() => {
          if (!isEditing) setEditTargetId(null);
        }}
      />

      <DeleteClassModal
        open={deleteTarget !== null}
        klass={deleteTarget}
        isSubmitting={isDeletingId === deleteTargetId}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          if (isDeletingId === null) setDeleteTargetId(null);
        }}
      />

      <StudentPicker
        open={pickerClass !== null}
        students={board.students}
        pendingStudentId={assigningStudentId}
        title={
          pickerClass
            ? `${pickerClass.slot === "AM" ? "오전" : "오후"} · ${pickerClass.teacher.name} 선생님 반 학생 배정`
            : "학생 배정"
        }
        onClose={() => {
          if (assigningStudentId === null) setPickerClassId(null);
        }}
        onPick={handleAssign}
      />
    </div>
  );
}
