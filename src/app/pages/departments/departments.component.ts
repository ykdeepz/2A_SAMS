import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Department } from '../../models/user.model';
import { LucideAngularModule, Plus, Edit2, Trash2, X, Save } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css']
})
export class DepartmentsComponent {
  private dataService = inject(DataService);

  // Icons
  readonly Plus = Plus;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Save = Save;

  departments = computed(() => this.dataService.departments());
  showAddModal = signal(false);
  editingDepartment = signal<Department | null>(null);
  departmentName = signal('');

  openAddModal() {
    this.departmentName.set('');
    this.editingDepartment.set(null);
    this.showAddModal.set(true);
  }

  openEditModal(dept: Department) {
    this.departmentName.set(dept.name);
    this.editingDepartment.set(dept);
    this.showAddModal.set(true);
  }

  closeModal() {
    this.showAddModal.set(false);
    this.editingDepartment.set(null);
    this.departmentName.set('');
  }

  async saveDepartment() {
    const name = this.departmentName().trim();
    if (!name) return;

    try {
      const editing = this.editingDepartment();
      if (editing) {
        // Update existing
        await this.dataService.updateDepartment({
          ...editing,
          name
        });
      } else {
        // Add new
        await this.dataService.addDepartment({
          name,
          created_at: new Date().toISOString()
        });
      }
      this.closeModal();
      
      await Swal.fire({
        title: 'Success!',
        text: editing ? 'Department updated successfully' : 'Department created successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to save department',
        icon: 'error'
      });
    }
  }

  async deleteDepartment(dept: Department) {
    if (!dept.id) return;
    
    const result = await Swal.fire({
      title: 'Delete Department?',
      text: `Are you sure you want to delete "${dept.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await this.dataService.deleteDepartment(dept.id);
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Department has been deleted',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to delete department',
          icon: 'error'
        });
      }
    }
  }
}
