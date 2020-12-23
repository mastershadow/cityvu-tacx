import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TrainerComponent } from './trainer/trainer.component';

const routes: Routes = [{ path: '**', component: TrainerComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
