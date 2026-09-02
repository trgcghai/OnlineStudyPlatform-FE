import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type LearnerQuizQuestion,
  type SubmitQuizAnswerPayload,
} from "@/services/api/learner-quizzes";
import { QuizQuestionType } from "@/services/api/quizzes";

interface LearnerQuizQuestionOptionsProps {
  question: LearnerQuizQuestion;
  answer: SubmitQuizAnswerPayload | undefined;
  disabled: boolean;
  onToggleOption: (questionId: string, optionIndex: number) => void;
  onSelectSingleOption: (questionId: string, optionIndex: number) => void;
  onUpdateEssay: (questionId: string, text: string) => void;
}

export default function LearnerQuizQuestionOptions({
  question,
  answer,
  disabled,
  onToggleOption,
  onSelectSingleOption,
  onUpdateEssay,
}: LearnerQuizQuestionOptionsProps) {
  if (question.type === QuizQuestionType.ESSAY) {
    return (
      <Textarea
        value={answer?.text ?? ""}
        disabled={disabled}
        placeholder="Nhập câu trả lời tự luận của bạn"
        className="min-h-32"
        onChange={(event) => onUpdateEssay(question.id, event.target.value)}
      />
    );
  }

  if (!question.isMultipleChoice) {
    const selectedOption = answer?.selectedOptionIndexes?.[0];

    return (
      <RadioGroup
        value={selectedOption === undefined ? "" : String(selectedOption)}
        className="flex flex-col gap-3"
        onValueChange={(value) =>
          onSelectSingleOption(question.id, Number(value))
        }
      >
        {question.options.map((option, optionIndex) => {
          const optionId = `${question.id}-${optionIndex}`;
          const checked = selectedOption === optionIndex;

          return (
            <Label
              key={optionId}
              htmlFor={optionId}
              className={cn(
                "rounded-2xl border p-3",
                checked && "border-primary bg-primary/10",
                disabled && "opacity-80",
              )}
            >
              <RadioGroupItem
                id={optionId}
                value={String(optionIndex)}
                disabled={disabled}
              />
              <span>{option}</span>
            </Label>
          );
        })}
      </RadioGroup>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option, optionIndex) => {
        const optionId = `${question.id}-${optionIndex}`;
        const selectedOptionIndexes = answer?.selectedOptionIndexes ?? [];
        const maxSelectableOptions = question.maxSelectableOptions ?? 1;
        const checked = Boolean(selectedOptionIndexes.includes(optionIndex));
        const optionDisabled =
          disabled ||
          (!checked && selectedOptionIndexes.length >= maxSelectableOptions);

        return (
          <Label
            key={optionId}
            htmlFor={optionId}
            className={cn(
              "rounded-2xl border p-3",
              checked && "border-primary bg-primary/10",
              optionDisabled && "opacity-80",
            )}
          >
            <Checkbox
              id={optionId}
              checked={checked}
              disabled={optionDisabled}
              onCheckedChange={() => onToggleOption(question.id, optionIndex)}
            />
            <span>{option}</span>
          </Label>
        );
      })}
    </div>
  );
}
