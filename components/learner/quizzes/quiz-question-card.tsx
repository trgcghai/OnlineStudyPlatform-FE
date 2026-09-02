import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type LearnerQuizQuestion,
  type QuizAttemptResult,
  type SubmitQuizAnswerPayload,
} from "@/services/api/learner-quizzes";
import { formatScore, getQuestionStatusLabel } from "@/utils/quizUtil";
import LearnerQuizQuestionOptions from "@/components/learner/quizzes/learner-quiz-question-options";

interface QuizQuestionCardProps {
  answer: SubmitQuizAnswerPayload | undefined;
  disabled: boolean;
  error: string | undefined;
  index: number;
  question: LearnerQuizQuestion;
  result: QuizAttemptResult | null;
  onToggleOption: (questionId: string, optionIndex: number) => void;
  onSelectSingleOption: (questionId: string, optionIndex: number) => void;
  onUpdateEssay: (questionId: string, text: string) => void;
}

export default function QuizQuestionCard({
  answer,
  disabled,
  error,
  index,
  question,
  result,
  onToggleOption,
  onSelectSingleOption,
  onUpdateEssay,
}: QuizQuestionCardProps) {
  const questionResult = result?.questions.find(
    (item) => item.questionId === question.id,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            Câu {index + 1}: {question.content}
          </CardTitle>
          <Badge variant="outline">{formatScore(question.points)} điểm</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <LearnerQuizQuestionOptions
          question={question}
          answer={answer}
          disabled={disabled}
          onToggleOption={onToggleOption}
          onSelectSingleOption={onSelectSingleOption}
          onUpdateEssay={onUpdateEssay}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {questionResult ? (
          <div className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {getQuestionStatusLabel(questionResult.status)}
              </Badge>
              <span className="text-muted-foreground">
                {formatScore(questionResult.score)} /{" "}
                {formatScore(questionResult.maxScore)} điểm
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
