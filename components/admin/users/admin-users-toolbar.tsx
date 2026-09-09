"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  type AssignableRole,
} from "@/lib/schemas/admin-user";
import type { UserStatus } from "@/services/api/users";

export type RoleFilter = "" | AssignableRole;
export type StatusFilter = "" | UserStatus;

const ALL_OPTION = "";

const ROLE_FILTER_ITEMS: Record<RoleFilter, string> = {
  [ALL_OPTION]: "Tất cả vai trò",
  Instructor: ROLE_LABELS.Instructor,
  Learner: ROLE_LABELS.Learner,
};

const STATUS_FILTER_ITEMS: Record<StatusFilter, string> = {
  [ALL_OPTION]: "Tất cả trạng thái",
  Active: STATUS_LABELS.Active,
  Inactive: STATUS_LABELS.Inactive,
};

export function AdminUsersToolbar({
  roleFilter,
  search,
  statusFilter,
  onRoleChange,
  onSearchChange,
  onStatusChange,
}: {
  roleFilter: RoleFilter;
  search: string;
  statusFilter: StatusFilter;
  onRoleChange: (value: RoleFilter) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
      <form
        className="xl:min-w-80 xl:flex-1"
        onSubmit={(event) => event.preventDefault()}
      >
        <InputGroup>
          <InputGroupInput
            placeholder="Tìm theo tên hoặc email..."
            aria-label="Tìm kiếm người dùng"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-xs"
            aria-label="Tìm kiếm"
          >
            <Search />
          </Button>
        </InputGroup>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={roleFilter}
          onValueChange={(value) => onRoleChange(value as RoleFilter)}
          items={ROLE_FILTER_ITEMS}
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Lọc theo vai trò"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_FILTER_ITEMS) as RoleFilter[]).map((value) => (
              <SelectItem key={value || "all"} value={value}>
                {ROLE_FILTER_ITEMS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusChange(value as StatusFilter)}
          items={STATUS_FILTER_ITEMS}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Lọc theo trạng thái"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_FILTER_ITEMS) as StatusFilter[]).map(
              (value) => (
                <SelectItem key={value || "all"} value={value}>
                  {STATUS_FILTER_ITEMS[value]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
