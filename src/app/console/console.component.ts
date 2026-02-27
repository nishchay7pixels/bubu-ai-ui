import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../app-state.service';
import { AppConfig } from '../models';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit {
  config!: AppConfig;

  skillName = '';
  skillInstructions = '';

  toolName = '';
  toolDescription = '';

  constructor(private readonly appState: AppStateService) {}

  ngOnInit(): void {
    this.config = this.appState.getConfig();
  }

  saveConfig(): void {
    this.config.temperature = this.clampNumber(this.config.temperature, 0, 1, 0.7);
    this.config.maxHistoryMessages = Math.round(this.clampNumber(this.config.maxHistoryMessages, 2, 30, 12));
    this.config.idleTimeoutSeconds = Math.round(this.clampNumber(this.config.idleTimeoutSeconds, 10, 600, 60));
    this.appState.saveConfig(this.config);
  }

  resetToDefaults(): void {
    this.config = { ...this.appState.defaultConfig };
    this.saveConfig();
  }

  addSkill(): void {
    if (!this.skillName.trim() || !this.skillInstructions.trim()) {
      return;
    }

    this.config = this.appState.addSkill(this.config, {
      name: this.skillName.trim(),
      instructions: this.skillInstructions.trim(),
      active: true
    });
    this.skillName = '';
    this.skillInstructions = '';
    this.saveConfig();
  }

  removeSkill(id: string): void {
    this.config.skills = this.config.skills.filter((skill) => skill.id !== id);
    this.saveConfig();
  }

  addTool(): void {
    if (!this.toolName.trim() || !this.toolDescription.trim()) {
      return;
    }

    this.config = this.appState.addTool(this.config, {
      name: this.toolName.trim(),
      description: this.toolDescription.trim(),
      active: true
    });
    this.toolName = '';
    this.toolDescription = '';
    this.saveConfig();
  }

  removeTool(id: string): void {
    this.config.tools = this.config.tools.filter((tool) => tool.id !== id);
    this.saveConfig();
  }

  private clampNumber(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, value));
  }
}
