import { CASE_TRANSITIONS } from './workflow';
import { CaseStatus, OfficerRole } from './common';
describe('GeoTwin canonical rules',()=>{
  it('keeps exactly five human roles',()=>expect(Object.values(OfficerRole)).toHaveLength(5));
  it('locks the archive end state',()=>expect(CASE_TRANSITIONS[CaseStatus.ARCHIVED]).toEqual([]));
  it('requires review before approval',()=>expect(CASE_TRANSITIONS[CaseStatus.PLAN_UNDER_REVIEW]).toContain(CaseStatus.PLAN_APPROVED));
});
