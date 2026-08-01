export interface ModuleItem {
  module: string;
  href: string;
  count: number;
  active?: boolean;
  elective?: boolean;
}

export interface PacketField {
  name: string;
  size: number;
  label?: string;
}
