import { Plugin } from 'obsidian'
import { HeatmapView, HEATMAP_VIEW_ID, HEATMAP_VIEW_OPTIONS } from './heatmap-view'

export default class HabitTrackerHeatmapPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerBasesView(HEATMAP_VIEW_ID, {
			name: "Scott's Habit Heatmap",
			icon: 'lucide-activity',
			factory: (controller, parentEl) => new HeatmapView(controller, parentEl),
			options: HEATMAP_VIEW_OPTIONS,
		})
	}
}
