/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../src/server/index'
import { LeadStatus, LeadSource } from '../src/types/enums'

const prisma = new PrismaClient()

// Test CSV with 50 leads for acceptance test
const fiftyLeadsCSV = `first_name,last_name,linkedin_url,email,company,title
John,Doe,https://linkedin.com/in/john-doe-1,john1@example.com,TechCorp,Engineer
Jane,Smith,https://linkedin.com/in/jane-smith-2,jane2@example.com,DesignCo,Designer
Mike,Johnson,https://linkedin.com/in/mike-johnson-3,mike3@example.com,DataInc,Scientist
Sarah,Williams,https://linkedin.com/in/sarah-williams-4,sarah4@example.com,CloudTech,DevOps
Tom,Brown,https://linkedin.com/in/tom-brown-5,tom5@example.com,StartupX,PM
Lisa,Davis,https://linkedin.com/in/lisa-davis-6,lisa6@example.com,FinTech,Analyst
David,Miller,https://linkedin.com/in/david-miller-7,david7@example.com,HealthTech,Researcher
Emma,Wilson,https://linkedin.com/in/emma-wilson-8,emma8@example.com,EduTech,Designer
Chris,Moore,https://linkedin.com/in/chris-moore-9,chris9@example.com,GreenEnergy,Engineer
Amy,Taylor,https://linkedin.com/in/amy-taylor-10,amy10@example.com,RetailTech,Manager
Robert,Anderson,https://linkedin.com/in/robert-anderson-11,robert11@example.com,CyberSec,Analyst
Jennifer,Thomas,https://linkedin.com/in/jennifer-thomas-12,jennifer12@example.com,AI-Labs,Engineer
Kevin,Jackson,https://linkedin.com/in/kevin-jackson-13,kevin13@example.com,GameStudio,Developer
Michelle,White,https://linkedin.com/in/michelle-white-14,michelle14@example.com,MediaCorp,Strategist
Steven,Harris,https://linkedin.com/in/steven-harris-15,steven15@example.com,LogisticsPro,Manager
Nicole,Martin,https://linkedin.com/in/nicole-martin-16,nicole16@example.com,BioTech,Engineer
Daniel,Garcia,https://linkedin.com/in/daniel-garcia-17,daniel17@example.com,ArchFirm,Architect
Rachel,Rodriguez,https://linkedin.com/in/rachel-rodriguez-18,rachel18@example.com,ConsultingGroup,Consultant
Brandon,Lewis,https://linkedin.com/in/brandon-lewis-19,brandon19@example.com,SportsData,Analyst
Stephanie,Lee,https://linkedin.com/in/stephanie-lee-20,stephanie20@example.com,TravelTech,Researcher
Jason,Walker,https://linkedin.com/in/jason-walker-21,jason21@example.com,InsureTech,Analyst
Amanda,Hall,https://linkedin.com/in/amanda-hall-22,amanda22@example.com,FoodTech,Designer
Ryan,Allen,https://linkedin.com/in/ryan-allen-23,ryan23@example.com,PropTech,Analyst
Melissa,Young,https://linkedin.com/in/melissa-young-24,melissa24@example.com,MusicTech,Engineer
Andrew,Hernandez,https://linkedin.com/in/andrew-hernandez-25,andrew25@example.com,SpaceTech,Engineer
Lauren,King,https://linkedin.com/in/lauren-king-26,lauren26@example.com,FashionTech,Manager
Joshua,Wright,https://linkedin.com/in/joshua-wright-27,joshua27@example.com,AgriTech,Scientist
Kimberly,Lopez,https://linkedin.com/in/kimberly-lopez-28,kimberly28@example.com,CleanTech,Engineer
Matthew,Hill,https://linkedin.com/in/matthew-hill-29,matthew29@example.com,QuantumCorp,Physicist
Ashley,Scott,https://linkedin.com/in/ashley-scott-30,ashley30@example.com,RoboTech,Engineer
James,Green,https://linkedin.com/in/james-green-31,james31@example.com,BlockchainInc,Developer
Jessica,Adams,https://linkedin.com/in/jessica-adams-32,jessica32@example.com,VRStudio,Developer
Nicholas,Baker,https://linkedin.com/in/nicholas-baker-33,nicholas33@example.com,DrugDiscovery,Scientist
Samantha,Gonzalez,https://linkedin.com/in/samantha-gonzalez-34,samantha34@example.com,SmartCity,Planner
Jonathan,Nelson,https://linkedin.com/in/jonathan-nelson-35,jonathan35@example.com,EnergyGrid,Engineer
Brittany,Carter,https://linkedin.com/in/brittany-carter-36,brittany36@example.com,PetTech,Scientist
Tyler,Mitchell,https://linkedin.com/in/tyler-mitchell-37,tyler37@example.com,AutoTech,Engineer
Megan,Perez,https://linkedin.com/in/megan-perez-38,megan38@example.com,WaterTech,Engineer
Gregory,Roberts,https://linkedin.com/in/gregory-roberts-39,gregory39@example.com,NanoTech,Scientist
Heather,Turner,https://linkedin.com/in/heather-turner-40,heather40@example.com,SolarTech,Engineer
Anthony,Phillips,https://linkedin.com/in/anthony-phillips-41,anthony41@example.com,WindPower,Engineer
Crystal,Campbell,https://linkedin.com/in/crystal-campbell-42,crystal42@example.com,OceanTech,Biologist
Eric,Parker,https://linkedin.com/in/eric-parker-43,eric43@example.com,WeatherTech,Meteorologist
Danielle,Evans,https://linkedin.com/in/danielle-evans-44,danielle44@example.com,MineTech,Engineer
Jordan,Edwards,https://linkedin.com/in/jordan-edwards-45,jordan45@example.com,RecycleTech,Engineer
Alexis,Collins,https://linkedin.com/in/alexis-collins-46,alexis46@example.com,SmartHome,Engineer
Justin,Stewart,https://linkedin.com/in/justin-stewart-47,justin47@example.com,QuantumNet,Engineer
Courtney,Sanchez,https://linkedin.com/in/courtney-sanchez-48,courtney48@example.com,NeuroTech,Scientist
Patrick,Morris,https://linkedin.com/in/patrick-morris-49,patrick49@example.com,SpaceX,Engineer
Kathryn,Rogers,https://linkedin.com/in/kathryn-rogers-50,kathryn50@example.com,DeepSea,Engineer`

describe('ACCEPTANCE TEST: Lead Model + CSV Import System', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.lead.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Gate 3 Acceptance Criteria', () => {
    it('✅ ACCEPTANCE TEST: Creates 50 leads via CSV upload endpoint, verifies data integrity, detects duplicates', async () => {
      // ==========================================
      // STEP 1: Upload 50 leads via CSV endpoint
      // ==========================================
      const csvBuffer = Buffer.from(fiftyLeadsCSV, 'utf-8')

      const importResponse = await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-50-leads.csv')
        .field('skipErrors', 'true')
        .expect(201)

      // Verify import response
      expect(importResponse.body).toMatchObject({
        success: true,
        data: {
          totalRows: 50,
          successCount: 50,
          errorCount: 0,
          duplicateCount: 0,
          errors: []
        }
      })

      // ==========================================
      // STEP 2: Verify all 50 leads in database
      // ==========================================
      const dbCount = await prisma.lead.count()
      expect(dbCount).toBe(50)

      // Verify specific lead details
      const firstLead = await prisma.lead.findFirst({
        where: { first_name: 'John', last_name: 'Doe' }
      })

      expect(firstLead).toMatchObject({
        first_name: 'John',
        last_name: 'Doe',
        linkedin_url: 'https://linkedin.com/in/john-doe-1',
        email: 'john1@example.com',
        company: 'TechCorp',
        title: 'Engineer',
        status: LeadStatus.IMPORTED,
        source: LeadSource.CSV_IMPORT
      })

      // ==========================================
      // STEP 3: Re-upload same CSV (test duplicates)
      // ==========================================
      const duplicateResponse = await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'duplicate-test.csv')
        .field('skipErrors', 'true')
        .expect(201)

      // Verify duplicate detection
      expect(duplicateResponse.body).toMatchObject({
        success: true,
        data: {
          totalRows: 50,
          successCount: 0,
          errorCount: 50, // All should be errors due to duplicates
          duplicateCount: 50
        }
      })

      // All errors should be duplicate errors
      const errors = duplicateResponse.body.data.errors
      expect(errors).toHaveLength(50)
      expect(errors[0]).toMatchObject({
        field: 'linkedin_url',
        message: 'Lead with this LinkedIn URL already exists'
      })

      // ==========================================
      // STEP 4: Verify no additional leads created
      // ==========================================
      const finalCount = await prisma.lead.count()
      expect(finalCount).toBe(50) // Should still be 50, no duplicates

      // ==========================================
      // STEP 5: Verify LinkedIn URL uniqueness
      // ==========================================
      const leads = await prisma.lead.findMany({
        select: { linkedin_url: true }
      })

      const uniqueUrls = new Set(leads.map(lead => lead.linkedin_url))
      expect(uniqueUrls.size).toBe(50) // All URLs should be unique

      // ==========================================
      // STEP 6: Test CRUD operations
      // ==========================================

      // Test GET with pagination
      const getResponse = await request(app)
        .get('/api/leads?page=1&limit=10')
        .expect(200)

      expect(getResponse.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: true,
          hasPrev: false
        }
      })

      expect(getResponse.body.data).toHaveLength(10)

      // Test single lead creation
      const newLeadData = {
        first_name: 'API',
        last_name: 'Test',
        linkedin_url: 'https://linkedin.com/in/api-test-unique',
        email: 'api@test.com'
      }

      const createResponse = await request(app)
        .post('/api/leads')
        .send(newLeadData)
        .expect(201)

      expect(createResponse.body).toMatchObject({
        success: true,
        data: {
          first_name: 'API',
          last_name: 'Test',
          linkedin_url: 'https://linkedin.com/in/api-test-unique',
          email: 'api@test.com',
          status: LeadStatus.IMPORTED,
          source: LeadSource.MANUAL_ENTRY
        }
      })

      const newLeadId = createResponse.body.data.id

      // Test lead update
      const updateResponse = await request(app)
        .put(`/api/leads/${newLeadId}`)
        .send({ company: 'Updated Corp' })
        .expect(200)

      expect(updateResponse.body).toMatchObject({
        success: true,
        data: {
          id: newLeadId,
          company: 'Updated Corp'
        }
      })

      // Test lead deletion
      await request(app)
        .delete(`/api/leads/${newLeadId}`)
        .expect(200)

      // Verify deletion
      await request(app)
        .get(`/api/leads/${newLeadId}`)
        .expect(404)

      // ==========================================
      // STEP 7: Verify final state
      // ==========================================
      const stats = await request(app)
        .get('/api/leads/stats')
        .expect(200)

      expect(stats.body).toMatchObject({
        success: true,
        data: {
          totalLeads: 50, // Back to 50 after deletion
          leadsBySource: {
            [LeadSource.CSV_IMPORT]: 50
          },
          leadsByStatus: {
            [LeadStatus.IMPORTED]: 50
          }
        }
      })

      console.log('✅ ACCEPTANCE TEST PASSED: All 50 leads created, duplicates detected, data integrity confirmed')
    })

    it('should handle CSV validation before import', async () => {
      const csvBuffer = Buffer.from(fiftyLeadsCSV, 'utf-8')

      const response = await request(app)
        .post('/api/leads/validate-csv')
        .attach('file', csvBuffer, 'validation-test.csv')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          isValid: true,
          errors: [],
          totalRows: 50,
          preview: expect.any(Array)
        }
      })

      expect(response.body.data.preview).toHaveLength(5) // Should preview 5 rows
    })

    it('should reject invalid file types', async () => {
      const textBuffer = Buffer.from('This is not a CSV', 'utf-8')

      await request(app)
        .post('/api/leads/import')
        .attach('file', textBuffer, 'not-csv.txt')
        .expect(400)
    })

    it('should handle malformed CSV gracefully', async () => {
      const malformedCSV = 'invalid,headers\nno,linkedin,url,here'
      const csvBuffer = Buffer.from(malformedCSV, 'utf-8')

      const response = await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'malformed.csv')
        .field('skipErrors', 'true')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.successCount).toBe(0)
      expect(response.body.data.errorCount).toBeGreaterThan(0)
    })
  })
})