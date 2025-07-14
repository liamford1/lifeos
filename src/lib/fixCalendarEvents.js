import { supabase } from './supabaseClient'

/**
 * Utility to check and fix existing calendar events that might have incorrect source types
 * This is a one-time fix for existing data
 */
export const checkAndFixCalendarEvents = async () => {
  try {
    // Get all calendar events
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at')

    if (error) {
      console.error('Error fetching calendar events:', error)
      return
    }

    console.log('📊 Found', events.length, 'calendar events')

    // Check for events that might be planned meals but have wrong source
    const eventsToUpdate = []
    
    for (const event of events) {
      // If the title contains "Dinner:", "Lunch:", "Breakfast:", "Snack:" and source is 'meal'
      // it's likely a planned meal that should have source 'planned_meal'
      if (event.source === 'meal' && 
          (event.title.includes('Dinner:') || 
           event.title.includes('Lunch:') || 
           event.title.includes('Breakfast:') || 
           event.title.includes('Snack:'))) {
        
        console.log('🔧 Found planned meal with wrong source:', event)
        eventsToUpdate.push({
          id: event.id,
          source: 'planned_meal'
        })
      }
    }

    if (eventsToUpdate.length > 0) {
      console.log('🔧 Updating', eventsToUpdate.length, 'events...')
      
      for (const update of eventsToUpdate) {
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ source: update.source })
          .eq('id', update.id)
        
        if (updateError) {
          console.error('❌ Error updating event', update.id, ':', updateError)
        } else {
          console.log('✅ Updated event', update.id, 'to source:', update.source)
        }
      }
    } else {
      console.log('✅ No events need updating')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

/**
 * Check what source types exist in the database
 */
export const checkSourceTypes = async () => {
  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('source, title')
      .order('created_at')

    if (error) {
      console.error('Error fetching calendar events:', error)
      return
    }

    const sourceCounts = {}
    events.forEach(event => {
      sourceCounts[event.source] = (sourceCounts[event.source] || 0) + 1
    })

    console.log('📊 Source type counts:', sourceCounts)
    
    // Show some examples of each source type
    const examples = {}
    events.forEach(event => {
      if (!examples[event.source]) {
        examples[event.source] = []
      }
      if (examples[event.source].length < 3) {
        examples[event.source].push(event.title)
      }
    })

    console.log('📋 Examples by source type:', examples)

  } catch (error) {
    console.error('Unexpected error:', error)
  }
} 